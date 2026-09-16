"use client";

import { useState } from "react";
import { X, Loader2, ScanLine } from "lucide-react";
import { createCase } from "@/app/actions/pipeline";
import { uploadVaultDocument } from "@/app/actions/vault";
import { toast } from "sonner";
import { DocumentScannerModal, type ScannerResult } from "@/components/documents/DocumentScannerModal";

export function NewCaseModal({ onClose, clients, coordinators }: { onClose: () => void, clients: any[], coordinators: any[] }) {
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pendingScan, setPendingScan] = useState<ScannerResult | null>(null);
  const [formData, setFormData] = useState({
    applicantName: "",
    clientId: clients[0]?.id || "",
    serviceType: "New Employment Visa",
    coordinatorId: coordinators[0]?.id || ""
  });

  const handleScanApply = (result: ScannerResult) => {
    if (result.fullName) setFormData((prev) => ({ ...prev, applicantName: result.fullName! }));
    setPendingScan(result);
    toast.success("Scanned fields applied -- review before saving");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.clientId || !formData.coordinatorId) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    const res = await createCase(formData);

    if (res.success && pendingScan && formData.clientId) {
      const CATEGORY_BY_TYPE: Record<string, string> = {
        PASSPORT: "Passport Copy",
        EMIRATES_ID: "Emirates ID",
        RESIDENCE_VISA: "UAE Visa",
        TRADE_LICENSE: "Trade License",
        EJARI: "Ejari",
        ESTABLISHMENT_CARD: "Establishment Card",
        LABOUR_CONTRACT: "Labour Contract",
        MEDICAL_FITNESS: "Medical Fitness",
      };
      const category = CATEGORY_BY_TYPE[pendingScan.documentType] || "Passport Copy";
      const title = pendingScan.documentNumber ? `${category} - ${pendingScan.documentNumber}` : `${category} (Scanned)`;
      await uploadVaultDocument({
        clientId: formData.clientId,
        category,
        title,
        expiryDate: pendingScan.expiryDate || new Date().toISOString().slice(0, 10),
        fileUrl: pendingScan.fileDataUrl,
      });
    }

    setLoading(false);

    if (res.success) {
      toast.success("Case initialized successfully!");
      // Reload page to fetch new initial state since we rely on server component for initial hydration
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white  rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl border  flex flex-col max-h-[90vh]">
        <div className="p-4 border-b  flex justify-between items-center bg-slate-50/50 ">
          <h2 className="font-bold text-lg text-slate-900 ">New Application Case</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200  rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <DocumentScannerModal open={scannerOpen} onOpenChange={setScannerOpen} onApply={handleScanApply} />

        <div className="p-6 overflow-y-auto">
          <form id="new-case-form" onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 h-10 rounded-lg border border-[#98682E]/30 bg-[#98682E]/10 text-[#98682E] text-sm font-semibold hover:bg-[#98682E]/20 transition-colors"
            >
              <ScanLine className="w-4 h-4" /> Scan Document (OCR)
            </button>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Applicant Full Name *</label>
              <input
                type="text"
                required
                value={formData.applicantName}
                onChange={e => setFormData({ ...formData, applicantName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-100  border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sponsor / Company *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-100  border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all appearance-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Service Type *</label>
                <select
                  required
                  value={formData.serviceType}
                  onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-100  border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all appearance-none"
                >
                  <option value="New Employment Visa">New Employment Visa</option>
                  <option value="Visa Renewal">Visa Renewal</option>
                  <option value="Visa Cancellation">Visa Cancellation</option>
                  <option value="Family Visa">Family Visa</option>
                  <option value="Freelance Permit">Freelance Permit</option>
                  <option value="Trade License Renewal">Trade License Renewal</option>
                  <option value="Business Setup">Business Setup</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned PRO *</label>
              <select
                required
                value={formData.coordinatorId}
                onChange={e => setFormData({ ...formData, coordinatorId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-100  border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all appearance-none"
              >
                {coordinators.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="p-4 border-t  bg-slate-50  mt-auto">
          <button
            type="submit"
            form="new-case-form"
            disabled={loading}
            className="w-full bg-[#98682E] hover:bg-[#98682E]/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Case"}
          </button>
        </div>
      </div>
    </div>
  );
}
