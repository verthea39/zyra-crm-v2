"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { createEmployee } from "@/app/actions/b2b";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddEmployeeModal({ corporateId, onClose }: { corporateId: string; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    passportNo: "",
    emiratesIdNo: "",
    visaCategory: "",
    visaStatus: "ACTIVE",
    expiryDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Employee name is required");
      return;
    }

    setLoading(true);
    const res = await createEmployee({ ...formData, corporateId });
    setLoading(false);

    if (res.success) {
      toast.success("Employee added");
      router.refresh();
      onClose();
    } else {
      toast.error(res.error || "Failed to add employee");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> Add Employee
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-0">
          <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Employee Name *">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
              />
            </Field>
            <Field label="Designation">
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Passport No">
                <input
                  type="text"
                  value={formData.passportNo}
                  onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
              <Field label="Emirates ID No">
                <input
                  type="text"
                  value={formData.emiratesIdNo}
                  onChange={(e) => setFormData({ ...formData, emiratesIdNo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Visa Status">
                <select
                  value={formData.visaStatus}
                  onChange={(e) => setFormData({ ...formData, visaStatus: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none appearance-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </Field>
              <Field label="Emirates ID Expiry">
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none"
                />
              </Field>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
          <button
            type="submit"
            form="add-employee-form"
            disabled={loading}
            className="w-full bg-[#98682E] hover:bg-[#7D5321] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Employee"}
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
