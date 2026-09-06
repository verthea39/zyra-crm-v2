import { listServiceTemplates, createWorkflowFromTemplate } from "@/lib/actions/workflows";
import { listClientsForPicker } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewWorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const [templates, clients] = await Promise.all([listServiceTemplates(), listClientsForPicker()]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Start a PRO Workflow</h1>
        <p className="text-sm text-muted-foreground">
          Instantiate a pre-built step sequence for a client.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createWorkflowFromTemplate} className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select name="clientId" defaultValue={clientId ?? ""} required>
                <option value="" disabled>
                  Select a client…
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.corporateProfile?.companyNameEn ?? c.individualProfile?.fullNameEn ?? c.id}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Service template</Label>
              <Select name="templateId" required>
                <option value="" disabled>
                  Select a service…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.stepDefs.length} steps)
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Create Workflow</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
