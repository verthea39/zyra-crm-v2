import Link from "next/link";
import { Plus } from "lucide-react";
import { listQuotations } from "@/lib/actions/quotations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

const statusTone: Record<QuotationStatus, "muted" | "default" | "success" | "destructive"> = {
  DRAFT: "muted",
  SENT: "default",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export default async function QuotationsPage() {
  const quotations = await listQuotations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Price estimates including zero-rated government disbursements and agency fees.
          </p>
        </div>
        <Link href="/quotations/new">
          <Button>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Quotation #</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Created date</th>
              <th className="px-4 py-3">Total (AED)</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No quotations yet.
                </td>
              </tr>
            )}
            {quotations.map((qtn) => {
              const clientName =
                qtn.client.corporateProfile?.companyNameEn ??
                qtn.client.individualProfile?.fullNameEn ??
                "—";
              return (
                <tr key={qtn.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/quotations/${qtn.id}`} className="font-medium text-primary hover:underline">
                      {qtn.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{clientName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(qtn.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatAED(Number(qtn.total))}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[qtn.status as QuotationStatus] || "muted"}>{qtn.status.replaceAll("_", " ")}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
