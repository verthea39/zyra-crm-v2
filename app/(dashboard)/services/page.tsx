import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Layers } from "lucide-react";
import { DeleteServiceButton } from "@/components/services/DeleteServiceButton";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requireSession();

  const templates = await db.serviceTemplate.findMany({
    include: { stepDefs: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Services & Templates</h1>
        <Link 
          href="/services/new" 
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          Create Template
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/20 group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground leading-tight group-hover:text-primary transition-colors">{tpl.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                    {tpl.category.replace(/_/g, ' ')}
                  </span>
                  {tpl.basePrice && (
                    <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 uppercase">
                      AED {tpl.basePrice.toString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/services/${tpl.id}/edit`}
                  className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                  title="Edit Template"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                </Link>
                <DeleteServiceButton templateId={tpl.id} />
              </div>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
              {tpl.description || "No description provided."}
            </p>

            <div className="mt-auto pt-4 border-t border-border mt-6">
              <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-3">Workflow Steps ({tpl.stepDefs.length})</h4>
              <ul className="space-y-2">
                {tpl.stepDefs.slice(0, 3).map((step, idx) => (
                  <li key={step.id} className="text-xs text-muted-foreground flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground">{idx + 1}</span>
                      <span className="truncate">{step.name}</span>
                    </div>
                    {step.description && (
                      <span className="pl-8 truncate opacity-80" title={step.description}>{step.description}</span>
                    )}
                  </li>
                ))}
                {tpl.stepDefs.length > 3 && (
                  <li className="text-xs text-muted-foreground italic pl-8 pt-1">
                    + {tpl.stepDefs.length - 3} more steps
                  </li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
