import prisma from "@/lib/prisma";
import { DocumentWizard } from "@/components/documents/DocumentWizard";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <DocumentWizard clients={clients} />
    </div>
  );
}
