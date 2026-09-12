import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import InvoiceDetailClient from "@/components/dashboard/invoices/InvoiceDetailClient";

export const metadata: Metadata = {
  title: "Invoice Details",
  description: "View invoice details, payment history, and record payments.",
};

export default async function InvoiceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("invoices:read");
  const params = await props.params;

  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: {
      client: {
        include: {
          corporateProfile: true,
          individualProfile: true
        }
      },
      lineItems: true,
      paymentAllocations: {
        include: {
          payment: {
            include: {
              account: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!invoice) {
    notFound();
  }

  // Sanitize BigInts to strings for Client Components
  const serializedInvoice = JSON.parse(
    JSON.stringify(invoice, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <InvoiceDetailClient invoice={serializedInvoice} />
    </div>
  );
}
