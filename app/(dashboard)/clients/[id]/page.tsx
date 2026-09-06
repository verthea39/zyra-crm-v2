import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient, deleteClient } from "@/lib/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAED, formatDate, expiryTier } from "@/lib/utils";
import { DeleteButton } from "@/components/ui/DeleteButton";

const expiryTone: Record<string, "destructive" | "warning" | "default" | "muted"> = {
  EXPIRED: "destructive",
  DUE_30: "warning",
  DUE_60: "default",
  DUE_90: "default",
  OK: "muted",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const name =
    client.corporateProfile?.companyNameEn ?? client.individualProfile?.fullNameEn ?? "—";
    
  const deleteAction = async () => {
    "use server";
    await deleteClient(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {client.clientType} · Added {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="success">{client.accountStatus}</Badge>
          <Link href={`/clients/${id}/edit`} className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
            Edit
          </Link>
          <DeleteButton onDelete={deleteAction} itemName="this client" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {client.corporateProfile && (
              <>
                <Row label="Trade license #" value={client.corporateProfile.tradeLicenseNumber} />
                <Row label="Issuing authority" value={client.corporateProfile.issuingAuthority} />
                <Row label="License type" value={client.corporateProfile.licenseType ?? "—"} />
                <Row label="Legal type" value={client.corporateProfile.legalType ?? "—"} />
                <Row
                  label="License expiry"
                  value={
                    client.corporateProfile.tradeLicenseExpiry
                      ? formatDate(client.corporateProfile.tradeLicenseExpiry)
                      : "—"
                  }
                />
                <Row label="VAT TRN" value={client.corporateProfile.vatTrn ?? "—"} />
                <Row label="Corporate Tax TRN" value={client.corporateProfile.corporateTaxTrn ?? "—"} />
                <Row label="Ejari #" value={client.corporateProfile.ejariNumber ?? "—"} />
              </>
            )}
            {client.individualProfile && (
              <>
                <Row label="Passport #" value={client.individualProfile.passportNumber} />
                <Row label="Nationality" value={client.individualProfile.nationality} />
                <Row
                  label="Passport expiry"
                  value={
                    client.individualProfile.passportExpiry
                      ? formatDate(client.individualProfile.passportExpiry)
                      : "—"
                  }
                />
                <Row label="Emirates ID #" value={client.individualProfile.emiratesIdNumber ?? "—"} />
                <Row
                  label="EID expiry"
                  value={
                    client.individualProfile.emiratesIdExpiry
                      ? formatDate(client.individualProfile.emiratesIdExpiry)
                      : "—"
                  }
                />
                <Row label="Visa type" value={client.individualProfile.visaType ?? "—"} />
                <Row
                  label="Sponsor company"
                  value={client.individualProfile.sponsorCompany?.companyNameEn ?? "—"}
                />
              </>
            )}
            <Row label="Assigned PRO" value={client.assignedPRO?.name ?? "Unassigned"} />
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Link href="/documents/new" className="text-xs text-primary hover:underline">
                + Attach document
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.documents.length === 0 && (
                <p className="text-sm text-muted-foreground">No documents on file yet.</p>
              )}
              {client.documents.map((doc) => {
                const tier = expiryTier(doc.expiryDate);
                return (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <span>
                      {doc.category.replaceAll("_", " ")} — {doc.fileName}
                    </span>
                    <div className="flex items-center gap-2">
                      {doc.expiryDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.expiryDate)}
                        </span>
                      )}
                      <Badge tone={expiryTone[tier]}>{doc.verificationStatus.replaceAll("_", " ")}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>PRO Workflows</CardTitle>
              <Link href="/workflows/new" className="text-xs text-primary hover:underline">
                + Start workflow
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.workflows.length === 0 && (
                <p className="text-sm text-muted-foreground">No active workflows.</p>
              )}
              {client.workflows.map((wf) => {
                const done = wf.steps.filter((s) => s.status === "COMPLETED").length;
                return (
                  <Link
                    key={wf.id}
                    href={`/workflows/${wf.id}`}
                    className="flex items-center justify-between text-sm hover:text-primary"
                  >
                    <span>{wf.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {done}/{wf.steps.length} steps · {wf.completedAt ? "Completed" : "In progress"}
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-card-foreground">{value}</span>
    </div>
  );
}
