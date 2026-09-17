import prisma from "@/lib/prisma";
import { logServerError } from "@/lib/logger";
import { DocumentWizard } from "@/components/documents/DocumentWizard";

export const dynamic = "force-dynamic";

async function getClients() {
  try {
    return await prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    logServerError(err, { action: "documents/new:getClients" });
    return [];
  }
}

export default async function NewDocumentPage() {
  const clients = await getClients();

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <DocumentWizard clients={clients} />
    </div>
  );
}
