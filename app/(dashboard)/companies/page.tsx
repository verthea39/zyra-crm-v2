import Link from "next/link";
import { Plus } from "lucide-react";
import { listClients } from "@/lib/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, expiryTier } from "@/lib/utils";

const expiryTone: Record<string, "destructive" | "warning" | "default" | "muted"> = {
  EXPIRED: "destructive",
  DUE_30: "warning",
  DUE_60: "default",
  DUE_90: "default",
  OK: "muted",
};

export default async function CompaniesPage() {
  const companies = (await listClients({ clientType: "CORPORATE" })) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Corporate accounts: trade license, issuing authority, TRN/VAT, establishment cards.
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4" /> New Company
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Trade license #</th>
              <th className="px-4 py-3">Authority</th>
              <th className="px-4 py-3">License expiry</th>
              <th className="px-4 py-3">VAT TRN</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No corporate accounts yet.
                </td>
              </tr>
            )}
            {companies.map((c) => {
              const p = c.corporateProfile;
              if (!p) return null;
              const tier = expiryTier(p.tradeLicenseExpiry);
              return (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium text-primary hover:underline">
                      {p.companyNameEn}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.tradeLicenseNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.issuingAuthority}</td>
                  <td className="px-4 py-3">
                    {p.tradeLicenseExpiry ? (
                      <span className="flex items-center gap-2">
                        {formatDate(p.tradeLicenseExpiry)}
                        {tier !== "OK" && <Badge tone={expiryTone[tier]}>{tier.replace("_", " ")}</Badge>}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.vatTrn ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
