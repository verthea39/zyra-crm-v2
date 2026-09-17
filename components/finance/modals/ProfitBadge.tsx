/** Internal-only profit/margin readout -- never shown on client-facing print output. */
export function ProfitBadge({ customerRate, supplierCost }: { customerRate: number; supplierCost: number }) {
  const margin = customerRate - supplierCost;
  const marginPct = customerRate > 0 ? (margin / customerRate) * 100 : 0;
  const isNegative = margin < 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        isNegative ? "text-rose-600" : "text-emerald-600"
      }`}
      title="Internal margin -- not shown to the client"
    >
      {isNegative ? "Loss" : "Profit"}: {isNegative ? "-" : "+"}AED {Math.abs(margin).toFixed(2)} ({marginPct.toFixed(1)}%)
    </span>
  );
}
