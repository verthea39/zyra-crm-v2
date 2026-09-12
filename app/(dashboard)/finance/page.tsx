import { Metadata } from "next";
import FinanceDashboard from "@/components/dashboard/finance/FinanceDashboard";
import { getSummaryAction, listTransactionsAction, getReceivablesAction } from "@/lib/actions/finance";

export const metadata: Metadata = {
  title: "Finance & Transactions",
  description: "Manage income, expenses, and client receivables.",
};

export default async function FinancePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  // Resolve named ranges
  const preset = (searchParams.preset as string) || "this_month";
  const now = new Date();
  
  let from = new Date(now.getFullYear(), now.getMonth(), 1);
  let to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  if (preset === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (preset === "this_year") {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (preset === "all_time") {
    from = new Date(2000, 0, 1);
    to = new Date(2999, 11, 31);
  }
  
  const [summaryRes, receivablesRes, txnsRes] = await Promise.all([
    getSummaryAction(from, to),
    getReceivablesAction(10),
    listTransactionsAction({ page: 1, pageSize: 50, from, to }),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Finance Dashboard</h2>
      </div>
      
      <FinanceDashboard 
        initialSummary={summaryRes.success ? summaryRes.data : null}
        initialTransactions={txnsRes.success ? txnsRes.data : { data: [], meta: {} }}
        initialReceivables={receivablesRes.success ? receivablesRes.data : []}
      />
    </div>
  );
}
