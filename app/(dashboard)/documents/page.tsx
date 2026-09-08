import Link from "next/link";
import { Plus } from "lucide-react";
import { listDocuments } from "@/lib/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
import { formatDate, expiryTier } from "@/lib/utils";

const tierMeta: Record<string, { label: string; tone: "destructive" | "warning" | "default" | "muted" }> = {
  EXPIRED: { label: "Expired", tone: "destructive" },
  DUE_30: { label: "Due in 30 days", tone: "warning" },
  DUE_60: { label: "Due in 60 days", tone: "default" },
  DUE_90: { label: "Due in 90 days", tone: "default" },
  OK: { label: "Valid", tone: "muted" },
};

export default async function DocumentsPage() {
  const documents = await listDocuments();

  const grouped: Record<string, typeof documents> = {
    EXPIRED: [],
    DUE_30: [],
    DUE_60: [],
    DUE_90: [],
    OK: [],
  };
  for (const doc of documents) {
    grouped[expiryTier(doc.expiryDate)].push(doc);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Document Vault</h1>
          <p className="text-sm text-muted-foreground">
            Secure storage with automated expiry tracking (Expired / 30 / 60 / 90 days).
          </p>
        </div>
        <Link href="/documents/new">
          <Button>
            <Plus className="h-4 w-4" /> Attach Document
          </Button>
        </Link>
      </div>

      {(["EXPIRED", "DUE_30", "DUE_60", "DUE_90", "OK"] as const).map((tier) => {
        const docs = grouped[tier];
        if (docs.length === 0) return null;
        const meta = tierMeta[tier];

        return (
          <div key={tier} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{meta.label}</h2>
              <Badge tone={meta.tone}>{docs.length}</Badge>
            </div>
            <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">File</th>
                    <th className="px-4 py-2">Expiry</th>
                    <th className="px-4 py-2">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {docs.map((doc) => {
                    const clientName =
                      doc.client.corporateProfile?.companyNameEn ??
                      doc.client.individualProfile?.fullNameEn ??
                      "—";
                    return (
                      <tr key={doc.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <Link href={`/clients/${doc.clientId}`} className="text-primary hover:underline">
                            {clientName}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {doc.category.replaceAll("_", " ")}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{doc.fileName}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {doc.expiryDate ? formatDate(doc.expiryDate) : "—"}
                        </td>
                        <td className="px-4 py-2">
                          <Badge tone="muted">{doc.verificationStatus.replaceAll("_", " ")}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      )}
    </div>
  );
}
