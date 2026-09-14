import { FileText, ArrowRight } from "lucide-react";

type CaseSummary = {
  id: string;
  reference: string;
  serviceType: string;
  stage: string;
  clientName: string;
};

export function ActiveCases({ cases }: { cases: CaseSummary[] }) {
  const preCheck = cases.filter(c => c.stage === 'PRE_CHECK');
  const submitted = cases.filter(c => c.stage === 'SUBMITTED');

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold tracking-tight">Active Pipeline</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Pre-Check Pending
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-bold">
              {preCheck.length}
            </span>
          </h3>
          <div className="space-y-3">
            {preCheck.map(c => (
              <div key={c.id} className="p-3 bg-muted/30 rounded-lg border border-border/40 hover:border-border transition-colors group cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{c.reference}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.serviceType}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium mt-2">{c.clientName}</p>
              </div>
            ))}
            {preCheck.length === 0 && <p className="text-sm text-muted-foreground">No cases in pre-check.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Submitted to Dept
            <span className="bg-blue-100 text-blue-700   px-2 py-0.5 rounded-full text-xs font-bold">
              {submitted.length}
            </span>
          </h3>
          <div className="space-y-3">
            {submitted.map(c => (
              <div key={c.id} className="p-3 bg-muted/30 rounded-lg border border-border/40 hover:border-border transition-colors group cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{c.reference}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.serviceType}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium mt-2">{c.clientName}</p>
              </div>
            ))}
            {submitted.length === 0 && <p className="text-sm text-muted-foreground">No submitted cases.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
