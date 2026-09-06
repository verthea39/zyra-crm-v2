import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { EditServiceForm } from "@/components/services/EditServiceForm";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();

  const { id } = await params;

  const template = await db.serviceTemplate.findUnique({
    where: { id },
    include: { stepDefs: { orderBy: { order: "asc" } } },
  });

  if (!template) {
    redirect("/services");
  }

  return <EditServiceForm template={template} />;
}
