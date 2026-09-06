export const VAT_RATE = 5; // UAE standard rate, %

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Pure calculation helper — also usable client-side for a live preview. */
export function calculateInvoiceTotals(
  lineItems: { type: string; quantity: number; unitPrice: number }[]
) {
  let subtotalServiceFees = 0;
  let subtotalGovDisbursements = 0;

  for (const item of lineItems) {
    const lineTotal = item.quantity * item.unitPrice;
    if (item.type === "AGENCY_SERVICE_FEE") {
      subtotalServiceFees += lineTotal;
    } else {
      subtotalGovDisbursements += lineTotal;
    }
  }

  const vatAmount = (subtotalServiceFees * VAT_RATE) / 100;
  const totalPayable = subtotalServiceFees + vatAmount + subtotalGovDisbursements;

  return {
    subtotalServiceFees: round2(subtotalServiceFees),
    subtotalGovDisbursements: round2(subtotalGovDisbursements),
    vatAmount: round2(vatAmount),
    totalPayable: round2(totalPayable),
  };
}
