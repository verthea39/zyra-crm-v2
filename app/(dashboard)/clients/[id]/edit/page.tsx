import { notFound, redirect } from "next/navigation";
import {
  getClient,
  updateClient,
  listCorporateClientsForSponsor,
} from "@/lib/actions/clients";
import { EditClientForm } from "./EditClientForm";

type FormState = { error?: string } | null;

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const sponsors =
    client.clientType === "INDIVIDUAL" ? await listCorporateClientsForSponsor() : [];

  const updateAction = async (
    _prevState: FormState,
    formData: FormData
  ): Promise<FormState> => {
    "use server";
    const result = await updateClient(id, formData);
    if (result?.error) return result;
    redirect(`/clients/${id}`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit Client</h1>
        <p className="text-sm text-muted-foreground">
          Update the full profile and account details for this client.
        </p>
      </div>

      <EditClientForm client={client} sponsors={sponsors} action={updateAction} />
    </div>
  );
}
