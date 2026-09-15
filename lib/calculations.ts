/**
 * Shared money math for all document types (Invoice, Quotation, Receipt).
 * All amounts are handled in minor units (fils; 100 fils = 1 AED) as integers
 * to avoid floating-point rounding errors, matching Document/DocumentItem in prisma/schema.prisma.
 */

export const DEFAULT_VAT_RATE = 5; // percent, AED standard rate

export type CalcLineItem = {
  quantity: number;
  unitPriceMinor: number;
  vatExempt?: boolean;
};

export type DocumentTotals = {
  subtotalMinor: number;
  vatableMinor: number;
  discountMinor: number;
  vatMinor: number;
  totalMinor: number;
};

export function lineTotalMinor(item: CalcLineItem): number {
  return Math.round(item.quantity * item.unitPriceMinor);
}

export function calculateDocumentTotals(
  items: CalcLineItem[],
  options: { discountMinor?: number; vatRate?: number } = {}
): DocumentTotals {
  const discountMinor = options.discountMinor ?? 0;
  const vatRate = options.vatRate ?? DEFAULT_VAT_RATE;

  const subtotalMinor = items.reduce((sum, item) => sum + lineTotalMinor(item), 0);
  const vatableMinor = items
    .filter((item) => !item.vatExempt)
    .reduce((sum, item) => sum + lineTotalMinor(item), 0);

  const discountedVatableMinor = Math.max(
    0,
    vatableMinor - Math.round((discountMinor * vatableMinor) / Math.max(subtotalMinor, 1))
  );

  const vatMinor = Math.round((discountedVatableMinor * vatRate) / 100);
  const totalMinor = subtotalMinor - discountMinor + vatMinor;

  return {
    subtotalMinor,
    vatableMinor,
    discountMinor,
    vatMinor,
    totalMinor: Math.max(0, totalMinor),
  };
}

export function minorToDisplay(minor: number): number {
  return minor / 100;
}

export function displayToMinor(value: number): number {
  return Math.round(value * 100);
}

export function formatMoney(minor: number, currency = "AED"): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minorToDisplay(minor));
}

/**
 * Single source of truth for the Total/Paid -> status mapping used by
 * Transaction (Invoice/Expense) records:
 *   paid <= 0             -> PENDING (unpaid / issued)
 *   0 < paid < total       -> PARTIALLY_PAID
 *   paid >= total          -> PAID
 * OVERDUE only applies while there's still a balance and the due date has passed.
 */
export function computeTransactionStatus(
  amountTotal: number,
  amountPaid: number,
  dueDate?: Date | string | null
): "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" {
  const balance = amountTotal - amountPaid;
  if (balance <= 0) return "PAID";
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  if (isOverdue) return "OVERDUE";
  return amountPaid > 0 ? "PARTIALLY_PAID" : "PENDING";
}
