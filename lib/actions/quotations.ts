"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { calculateInvoiceTotals, VAT_RATE, round2 } from "@/lib/invoice-utils";
import { requirePermission } from "@/lib/session";

const quotationStatusSchema = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]);

const lineItemSchema = z.object({
  description: z.string().min(1),
  type: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  govReceiptRef: z.string().optional(),
});

const createQuotationSchema = z.object({
  clientId: z.string().min(1),
  lineItemsJson: z.string().min(2), // JSON-encoded array of lineItemSchema
});

async function nextQuotationNumber() {
  const year = new Date().getFullYear();
  const count = await db.quotation.count({
    where: { reference: { startsWith: `ZYR-EST-${year}-` } },
  });
  return `ZYR-EST-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createQuotation(formData: FormData) {
  await requirePermission("workflows:write");
  const parsed = createQuotationSchema.parse(Object.fromEntries(formData.entries()));
  const lineItems = z.array(lineItemSchema).min(1).parse(JSON.parse(parsed.lineItemsJson));

  const totals = calculateInvoiceTotals(lineItems);
  const reference = await nextQuotationNumber();

  // For Quotation, subtotal = services + gov disbursements
  const subtotal = totals.subtotalServiceFees + totals.subtotalGovDisbursements;

  const quotation = await db.quotation.create({
    data: {
      clientId: parsed.clientId,
      reference,
      subtotal,
      vatAmount: totals.vatAmount,
      total: totals.totalPayable,
      status: "DRAFT",
      lineItems: {
        create: lineItems.map((item) => ({
          description: item.description,
          type: item.type,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          govReceiptRef: item.govReceiptRef || null,
        })),
      },
    },
  });

  revalidatePath("/quotations");
  revalidatePath(`/clients/${parsed.clientId}`);
  redirect(`/quotations/${quotation.id}`);
}

export async function setQuotationStatus(quotationId: string, status: string) {
  await requirePermission("quotations:approve");
  const parsedStatus = quotationStatusSchema.parse(status);
  await db.quotation.update({ where: { id: quotationId }, data: { status: parsedStatus } });
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/quotations");
}

export async function listQuotations() {
  await requirePermission("quotations:read");
  return db.quotation.findMany({
    include: { client: { include: { corporateProfile: true, individualProfile: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuotation(id: string) {
  await requirePermission("quotations:read");
  return db.quotation.findUnique({
    where: { id },
    include: {
      client: { include: { corporateProfile: true, individualProfile: true } },
      lineItems: true,
    },
  });
}

export async function deleteQuotation(id: string) {
  await requirePermission("workflows:write");
  await db.quotation.delete({ where: { id } });
  revalidatePath("/quotations");
  redirect("/quotations");
}

export async function convertToInvoice(quotationId: string) {
  throw new Error("Invoice conversion is deprecated. Create a Transaction in the Finance dashboard.");
}
