"use client";

import { MessageCircle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export type ChecklistCase = {
  id: string;
  applicantName: string | null;
  clientName: string;
  clientId: string | null;
  stage: string;
  reference: string;
  phone: string | null;
  slaStatus: "OVERDUE" | "DUE_SOON" | "ON_TRACK";
  slaText: string;
};

export function ActionChecklist({ cases }: { cases: ChecklistCase[] }) {
  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      DRAFT_INTAKE: "Draft & Intake",
      PRE_CHECK: "Document Pre-Check",
      SUBMITTED: "Submitted & Pending",
      OFFER_LETTER_MOHRE: "MOHRE Offer Letter",
      ENTRY_PERMIT: "Entry Permit Issuance",
      MEDICAL_BIOMETRICS: "Medical & Biometrics",
      VISA_STAMPING_EID: "Visa Stamping & EID",
      COMPLETED: "Completed",
      COMPLETED_HANDOVER: "Completed & Handover",
    };
    return labels[stage] || stage;
  };

  const getSlaBadge = (status: string, text: string) => {
    if (status === "OVERDUE") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> {text}
        </span>
      );
    }
    if (status === "DUE_SOON") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> {text}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        {text}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Today's Action Checklist</h2>
          <p className="text-xs text-slate-500 mt-0.5">High priority cases requiring immediate follow-up</p>
        </div>
        <span className="text-[10px] font-bold bg-[#FDF8F0] text-[#98682E] border border-[#EADBC8] px-2 py-1 rounded-md uppercase">
          {cases.length} Tasks
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium">All clear for today!</p>
            <p className="text-xs mt-1">No urgent actions pending.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cases.map((c) => (
              <li key={c.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between group">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {c.applicantName || "Unknown Applicant"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {c.clientId ? (
                        <Link href={`/clients/${c.clientId}`} className="hover:text-primary hover:underline">{c.clientName}</Link>
                      ) : (
                        c.clientName
                      )}
                      <span className="mx-1">•</span> <span className="font-mono">{c.reference}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                      {getStageLabel(c.stage)}
                    </span>
                    {getSlaBadge(c.slaStatus, c.slaText)}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  {c.phone ? (
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Hello%20regarding%20your%20application%20${c.reference}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="WhatsApp Client"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  )}
                  
                  <Link
                    href={`/pipeline?highlight=${c.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#98682E] text-white hover:bg-[#7D5321] transition-colors text-xs font-semibold shadow-sm"
                  >
                    Action <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
