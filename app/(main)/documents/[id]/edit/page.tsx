import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getDocument } from "@/app/actions/documents";
import { DocumentWizard } from "@/components/documents/DocumentWizard";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [document, clients] = await Promise.all([
    getDocument(id),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!document) notFound();

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <DocumentWizard
        clients={clients}
        initialData={{
          id: document.id,
          type: document.type,
          clientId: document.clientId,
          dueDate: document.dueDate ? document.dueDate.toISOString() : null,
          expiryDate: document.expiryDate ? document.expiryDate.toISOString() : null,
          discountMinor: document.discountMinor,
          vatRate: document.vatRate,
          notes: document.notes,
          items: document.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPriceMinor: i.unitPriceMinor,
            vatExempt: i.vatExempt,
          })),
        }}
      />
    </div>
  );
}
