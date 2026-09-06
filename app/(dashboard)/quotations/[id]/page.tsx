import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuotation, deleteQuotation } from "@/lib/actions/quotations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAED, formatDate } from "@/lib/utils";
import { DeleteButton } from "@/components/ui/DeleteButton";

type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

const statusTone: Record<QuotationStatus, "muted" | "default" | "success" | "destructive"> = {
  DRAFT: "muted",
  SENT: "default",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotation = await getQuotation(id);
  if (!quotation) notFound();

  const clientName =
    quotation.client.corporateProfile?.companyNameEn ??
    quotation.client.individualProfile?.fullNameEn ??
    "—";

  const govLines = quotation.lineItems.filter((li) => li.type === "GOVERNMENT_CHARGE");
  const serviceLines = quotation.lineItems.filter((li) => li.type === "AGENCY_SERVICE_FEE");

  const deleteAction = async () => {
    "use server";
    await deleteQuotation(id);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            QUOTATION <span className="text-muted-foreground">/ عرض سعر</span>
          </h1>
          <p className="text-sm text-muted-foreground">{quotation.reference}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone[quotation.status as QuotationStatus] || "muted"}>
            {quotation.status.replaceAll("_", " ")}
          </Badge>

          <a href={`/api/quotations/${quotation.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Download PDF
            </button>
          </a>
          <DeleteButton onDelete={deleteAction} itemName="this quotation" />
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Prepared for</p>
            <p className="font-medium text-card-foreground">{clientName}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase text-muted-foreground">Prepared By</p>
            <p className="font-medium text-card-foreground">ZYRA Documents Clearance Services</p>
            <p className="text-xs text-muted-foreground">
              Date {formatDate(quotation.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Service Fees (5% VAT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {serviceLines.length === 0 && <p className="text-muted-foreground">None</p>}
          {serviceLines.map((li) => {
            const lineTotal = Number(li.quantity) * Number(li.unitPrice) * 1.05; // including 5% VAT
            return (
              <div key={li.id} className="flex justify-between">
                <span>
                  {li.description} × {li.quantity.toString()}
                </span>
                <span>{formatAED(lineTotal)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Government Charges / Disbursements (Estimated, 0% VAT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {govLines.length === 0 && <p className="text-muted-foreground">None</p>}
          {govLines.map((li) => {
            const lineTotal = Number(li.quantity) * Number(li.unitPrice);
            return (
              <div key={li.id} className="flex justify-between">
                <span>
                  {li.description} × {li.quantity.toString()}
                </span>
                <span>{formatAED(lineTotal)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatAED(Number(quotation.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT Amount (5%)</span>
            <span>{formatAED(Number(quotation.vatAmount))}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total Estimated (AED)</span>
            <span>{formatAED(Number(quotation.total))}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
