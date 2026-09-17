"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCaseDetails } from "@/app/actions/pipeline";
import type { CasePriority } from "@prisma/client";

const PRIORITY_OPTIONS: CasePriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function EditCaseModal({
  caseData,
  clients,
  coordinators,
  onClose,
  onSaved,
}: {
  caseData: any;
  clients: any[];
  coordinators: any[];
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [applicantName, setApplicantName] = useState(caseData.applicantName || "");
  const [clientId, setClientId] = useState(caseData.clientId || clients[0]?.id || "");
  const [coordinatorId, setCoordinatorId] = useState(caseData.coordinatorId || coordinators[0]?.id || "");
  const [priority, setPriority] = useState<CasePriority>(caseData.priority || "NORMAL");
  const [notes, setNotes] = useState(caseData.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !clientId || !coordinatorId) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    const res = await updateCaseDetails({
      caseId: caseData.id,
      applicantName,
      clientId,
      coordinatorId,
      priority,
      notes: notes || undefined,
    });
    setSaving(false);

    if (res.success) {
      toast.success("Case updated successfully");
      onSaved(res.case);
      onClose();
    } else {
      toast.error(res.error || "Failed to update case");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Edit Case</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{caseData.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="edit-case-form" className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Applicant Full Name *</label>
            <input
              type="text"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 border-transparent focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Sponsor / Company *</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 border-transparent focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none transition-all"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Assigned Staff *</label>
              <select
                required
                value={coordinatorId}
                onChange={(e) => setCoordinatorId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 border-transparent focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none transition-all"
              >
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`h-9 rounded-lg text-xs font-bold uppercase tracking-wide border transition-colors ${
                    priority === p
                      ? "bg-[#98682E] border-[#98682E] text-white"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Internal remarks about this case..."
              className="w-full px-4 py-2 bg-slate-100 border-transparent focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none transition-all resize-none"
            />
          </div>
        </form>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            form="edit-case-form"
            disabled={saving}
            className="bg-[#98682E] hover:bg-[#7D5321] text-white font-semibold text-sm px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
