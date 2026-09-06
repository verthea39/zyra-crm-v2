import { notFound, redirect } from "next/navigation";
import { getClient, updateClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  // The server action to update the client
  const updateAction = async (formData: FormData) => {
    "use server";
    await updateClient(id, formData);
    redirect(`/clients/${id}`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit Client</h1>
        <p className="text-sm text-muted-foreground">
          Update the status and lead source for this client.
        </p>
      </div>

      <form action={updateAction}>
        <Card>
          <CardHeader>
            <CardTitle>Client Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Lead source</Label>
              <Select name="leadSource" defaultValue={client.leadSource}>
                <option value="WALK_IN">Walk-in</option>
                <option value="REFERRAL">Referral</option>
                <option value="PORTAL">Portal</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="FIELD_AGENT">Field Agent</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <Label>Account Status</Label>
              <Select name="accountStatus" defaultValue={client.accountStatus}>
                <option value="ACTIVE">Active</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
