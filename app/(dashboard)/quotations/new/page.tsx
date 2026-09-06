import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { QuotationBuilder } from "@/components/dashboard/QuotationBuilder";
import { listServices } from "@/lib/actions/services";
import { listClientsForPicker } from "@/lib/actions/documents";

export default async function NewQuotationPage() {
  const [clients, services] = await Promise.all([
    listClientsForPicker(),
    listServices(),
  ]);

  const options = clients.map((c) => ({
    id: c.id,
    label: c.corporateProfile?.companyNameEn ?? c.individualProfile?.fullNameEn ?? c.id,
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">New Quotation</h1>
        <p className="text-sm text-muted-foreground">
          Prepare an estimated price quote for a client.
        </p>
      </div>
      {options.length === 0 && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">No clients found.</p>
            <p className="text-xs">
              <Link href="/clients/new" className="underline">
                Create a client
              </Link>{" "}
              before preparing a quotation.
            </p>
          </div>
        </div>
      )}
      <QuotationBuilder clients={options} services={services} />
    </div>
  );
}
