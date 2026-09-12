"use client";

import { useState } from "react";
import { formatAED } from "@/lib/utils";
import { updateDealStage } from "@/lib/actions/crm";
import { Calendar, Building, User } from "lucide-react";
import Link from "next/link";

const STAGES = [
  { id: "QUALIFIED", label: "Qualified" },
  { id: "PROPOSAL_SENT", label: "Proposal Sent" },
  { id: "GOV_PROCESSING", label: "Gov. Processing" },
  { id: "WON", label: "Closed Won" },
];

export function KanbanBoard({ initialDeals }: { initialDeals: any[] }) {
  const [deals, setDeals] = useState(initialDeals);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (!dealId) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: stageId } : d))
    );

    try {
      await updateDealStage(dealId, stageId);
      // Optional: show a small toast here if we had a toast library
    } catch (err: any) {
      alert(err.message || "Failed to update deal stage");
      // Revert if failed (simple refresh works or re-sync)
      setDeals(initialDeals);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] items-start">
      {STAGES.map((stage) => (
        <div
          key={stage.id}
          className="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-xl border border-border/50 h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <div className="p-4 border-b border-border/50 font-semibold flex items-center justify-between bg-muted/50 rounded-t-xl">
            <span>{stage.label}</span>
            <span className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border border-border">
              {deals.filter((d) => d.stage === stage.id).length}
            </span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {deals
              .filter((d) => d.stage === stage.id)
              .map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal.id)}
                  className="bg-card p-4 rounded-lg border border-border/50 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                >
                  <div className="font-medium text-sm mb-1">{deal.title}</div>
                  <div className="text-lg font-semibold text-primary mb-3">
                    {formatAED(Number(deal.valueMinor) / 100)}
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {deal.client && (
                      <Link href={`/clients/${deal.client.id}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        {deal.client.clientType === "CORPORATE" ? <Building className="size-3" /> : <User className="size-3" />}
                        <span className="truncate">
                          {deal.client.clientType === "CORPORATE" 
                            ? deal.client.corporateProfile?.companyNameEn 
                            : deal.client.individualProfile?.fullNameEn}
                        </span>
                      </Link>
                    )}
                    {deal.expectedCloseDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
