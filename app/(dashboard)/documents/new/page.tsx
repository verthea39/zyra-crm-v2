import { createDocument, listClientsForPicker } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const clients = await listClientsForPicker();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Attach Document</h1>
        <p className="text-sm text-muted-foreground">
          Record a document against a client and track its expiry.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDocument} className="space-y-4">
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
              <Label>Category</Label>
              <Select name="category" required>
                <option value="PASSPORT">Passport</option>
                <option value="EMIRATES_ID">Emirates ID</option>
                <option value="TRADE_LICENSE">Trade License</option>
                <option value="EJARI">Ejari</option>
                <option value="TENANCY_CONTRACT">Tenancy Contract</option>
                <option value="MOA">MOA</option>
                <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
                <option value="MEDICAL_FITNESS_CERT">Medical Fitness Certificate</option>
                <option value="ESTABLISHMENT_CARD">Establishment Card</option>
                <option value="VISA">Visa</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <Label>File name</Label>
              <Input name="fileName" placeholder="passport-scan.pdf" required />
            </div>
            <div>
              <Label>File URL</Label>
              <Input
                name="fileUrl"
                type="url"
                placeholder="https://storage.example.com/…"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Wire this to your storage upload widget (S3 / Supabase / Firebase Storage) — paste
                the resulting URL here.
              </p>
            </div>
            <div>
              <Label>Expiry date</Label>
              <Input type="date" name="expiryDate" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Attach Document</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
