import { notFound } from "next/navigation";
import { getDocument } from "@/app/actions/documents";
import { getCompanyBranding } from "@/lib/companyBranding";
import { getEntityActivity } from "@/lib/activity";
import { DocumentDetail } from "@/components/documents/DocumentDetail";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [document, branding] = await Promise.all([getDocument(id), getCompanyBranding()]);

  if (!document) notFound();

  const activity = await getEntityActivity(document.type, id);

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <DocumentDetail document={document as any} branding={branding} activity={activity as any} />
    </div>
  );
}
