"use client";

import { useState } from "react";
import { X, Loader2, UploadCloud } from "lucide-react";
import { uploadVaultDocument } from "@/app/actions/vault";
import { toast } from "sonner";
import { ClientCombobox } from "@/components/ui/client-combobox";

const CATEGORIES = [
  "Passport Copy",
  "UAE Visa",
  "Emirates ID",
  "Trade License",
  "Establishment Card",
  "Labour Contract",
  "Ejari",
  "Medical / Insurance",
  "Medical Fitness"
];

export function UploadDocumentModal({ onClose, clients }: { onClose: () => void, clients: any[] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    category: CATEGORIES[0],
    title: "",
    expiryDate: "",
    remarks: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.category || !formData.title || !formData.expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    // Passing a placeholder for fileUrl since local file storage isn't fully implemented in this mockup
    const res = await uploadVaultDocument({
      ...formData,
      fileUrl: "/placeholder-upload.pdf"
    });
    setLoading(false);

    if (res.success) {
      toast.success("Document uploaded securely");
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90dvh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-[#0F172A]">Upload Document</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="upload-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Belongs To (Client) *</label>
              <ClientCombobox
                clients={clients}
                value={formData.clientId}
                onChange={(id) => setFormData({ ...formData, clientId: id })}
                placeholder="Search by name, company, or phone..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Document Category *</label>
              <select
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all appearance-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Document Ref / Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all"
                placeholder="e.g. Passport No. XXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">File Upload *</label>
              <div className="w-full px-4 py-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
                <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                <span className="text-xs mt-1">PDF, JPG, PNG (Max 5MB)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remarks / Notes</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all"
                placeholder="Optional notes"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
          <button
            type="submit"
            form="upload-form"
            disabled={loading}
            className="w-full bg-[#98682E] hover:bg-[#7D5321] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
}
