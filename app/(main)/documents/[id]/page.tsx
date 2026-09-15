import { notFound } from "next/navigation";
import { getDocument } from "@/app/actions/documents";
import { DocumentDetail } from "@/components/documents/DocumentDetail";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) notFound();

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <DocumentDetail document={document as any} />
    </div>
  );
}
