import { Metadata } from "next";
import InvoicesClient from "@/components/dashboard/invoices/InvoicesClient";
import { listTransactionsAction } from "@/lib/actions/finance";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Invoices",
  description: "View all issued invoices and income transactions.",
};

export default async function InvoicesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const pageSize = 50;

  // Fetch only INCOME transactions (which serve as Invoices in this system)
  const txnsRes = await listTransactionsAction({
    page,
    pageSize,
    direction: "INCOME"
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="size-8 text-primary" />
          Invoices
        </h2>
      </div>
      <p className="text-muted-foreground mb-6">
        A complete ledger of all billed services, government fees, and income transactions.
      </p>
      
      <InvoicesClient 
        initialData={txnsRes.success ? txnsRes.data : { data: [], meta: {} }}
      />
    </div>
  );
}
