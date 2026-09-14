import { Wallet, Landmark, TrendingUp } from "lucide-react";

export function FinancialCounter({
  govFeesTotal,
  serviceFeesTotal,
}: {
  govFeesTotal: number;
  serviceFeesTotal: number;
}) {
  const formatMoney = (minorUnits: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(minorUnits / 100);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold tracking-tight">Financial Overview</h2>
        </div>
        <span className="text-xs text-muted-foreground">All time (Paid)</span>
      </div>

      <div className="space-y-4">
        {/* Bucket 1: Gov Fees */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100  rounded-lg">
              <Landmark className="w-5 h-5 text-slate-600 " />
            </div>
            <div>
              <p className="text-sm font-medium">Government Fees</p>
              <p className="text-xs text-muted-foreground mt-0.5">0% Markup / Pass-through</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">{formatMoney(govFeesTotal)}</p>
          </div>
        </div>

        {/* Bucket 2: Service Revenue */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50  border border-emerald-100 ">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100  rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 " />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900 ">Zyra Service Revenue</p>
              <p className="text-xs text-emerald-600  mt-0.5">Gross Agency Profit</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-emerald-700 ">{formatMoney(serviceFeesTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
