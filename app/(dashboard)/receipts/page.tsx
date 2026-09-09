import { Metadata } from "next";
import ReceiptsClient from "@/components/dashboard/receipts/ReceiptsClient";
import { listPaymentsAction } from "@/lib/actions/finance";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Receipts & Payments",
  description: "View all incoming and outgoing payment records.",
};

export default async function ReceiptsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const pageSize = 50;

  const paymentsRes = await listPaymentsAction({
    page,
    pageSize,
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="size-8 text-primary" />
          Receipts
        </h2>
      </div>
      <p className="text-muted-foreground mb-6">
        A complete log of all payments collected and payments made.
      </p>
      
      <ReceiptsClient 
        initialData={paymentsRes.success ? paymentsRes.data : { data: [], meta: {} }}
      />
    </div>
  );
}
