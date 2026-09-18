import { notFound } from "next/navigation";
import { getClientProfile } from "@/app/actions/clients";
import { ClientProfileView } from "@/components/clients/ClientProfileView";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientProfile(id);

  if (!client) notFound();

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6">
      <ClientProfileView client={client} />
    </div>
  );
}
