"use client";

import { useState } from "react";
import { X, Loader2, Pencil } from "lucide-react";
import { updateCompany } from "@/app/actions/b2b";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Company = {
  id: string;
  name: string;
  trnNumber?: string | null;
  tradeLicenseNo?: string | null;
  expiryDate?: string | Date | null;
  mohreQuotaTotal?: number | null;
  email?: string | null;
  phone?: string | null;
};

export function EditCompanyModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name || "",
    trnNumber: company.trnNumber || "",
    tradeLicenseNo: company.tradeLicenseNo || "",
    expiryDate: company.expiryDate ? new Date(company.expiryDate).toISOString().slice(0, 10) : "",
    mohreQuotaTotal: String(company.mohreQuotaTotal ?? 20),
    email: company.email || "",
    phone: company.phone || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setLoading(true);
    const res = await updateCompany(company.id, {
      ...formData,
      mohreQuotaTotal: Number(formData.mohreQuotaTotal) || 20,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Company details updated");
      router.refresh();
      onClose();
    } else {
      toast.error(res.error || "Failed to update company");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90dvh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-600" /> Edit Company
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-0">
          <form id="edit-company-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Company Name *">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="TRN Number">
                <input
                  type="text"
                  value={formData.trnNumber}
                  onChange={(e) => setFormData({ ...formData, trnNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
              <Field label="Trade License No">
                <input
                  type="text"
                  value={formData.tradeLicenseNo}
                  onChange={(e) => setFormData({ ...formData, tradeLicenseNo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="License Expiry">
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
              <Field label="MOHRE Total Quota">
                <input
                  type="number"
                  min={0}
                  value={formData.mohreQuotaTotal}
                  onChange={(e) => setFormData({ ...formData, mohreQuotaTotal: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
          <button
            type="submit"
            form="edit-company-form"
            disabled={loading}
            className="w-full bg-[#98682E] hover:bg-[#7D5321] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}
