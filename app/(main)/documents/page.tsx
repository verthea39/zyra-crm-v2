import { getDocuments } from "@/app/actions/documents";
import { DocumentList } from "@/components/documents/DocumentList";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <DocumentList documents={documents as any} />
    </div>
  );
}
