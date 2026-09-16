"use client";

import { useState } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { createCompany } from "@/app/actions/b2b";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddCompanyModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tradeLicenseNo: "",
    trnNumber: "",
    establishmentCardNo: "",
    mohreQuotaTotal: "20",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setLoading(true);
    const res = await createCompany({
      ...formData,
      mohreQuotaTotal: Number(formData.mohreQuotaTotal) || 20,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Company added to B2B Registry");
      router.refresh();
      onClose();
    } else {
      toast.error(res.error || "Failed to add company");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Add Company
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-0">
          <form id="add-company-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Company Name *">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                placeholder="e.g. Apex Tech LLC"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Trade License No">
                <input
                  type="text"
                  value={formData.tradeLicenseNo}
                  onChange={(e) => setFormData({ ...formData, tradeLicenseNo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                />
              </Field>
              <Field label="TRN Number">
                <input
                  type="text"
                  value={formData.trnNumber}
                  onChange={(e) => setFormData({ ...formData, trnNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="MOHRE Establishment Card No">
                <input
                  type="text"
                  value={formData.establishmentCardNo}
                  onChange={(e) => setFormData({ ...formData, establishmentCardNo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                />
              </Field>
              <Field label="Total Quota Allocation">
                <input
                  type="number"
                  min={0}
                  value={formData.mohreQuotaTotal}
                  onChange={(e) => setFormData({ ...formData, mohreQuotaTotal: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none"
                />
              </Field>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
          <button
            type="submit"
            form="add-company-form"
            disabled={loading}
            className="w-full bg-[#98682E] hover:bg-[#7D5321] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Company"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">{label}</label>
      {children}
    </div>
  );
}
