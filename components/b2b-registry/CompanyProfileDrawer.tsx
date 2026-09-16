"use client";

import { useEffect, useState } from "react";
import { X, Pencil, Users, FileText, UserPlus, Loader2, Building2 } from "lucide-react";
import { getCompanyProfile } from "@/app/actions/b2b";
import { EditCompanyModal } from "./EditCompanyModal";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { format } from "date-fns";

export function CompanyProfileDrawer({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getCompanyProfile(companyId);
    setCompany(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const employeeCount = company?.employees?.length || 0;
  const totalQuota = company?.mohreQuotaTotal ?? 20;
  const availableSlots = Math.max(totalQuota - employeeCount, 0);
  const utilization = totalQuota > 0 ? Math.round((employeeCount / totalQuota) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h2 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Company Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : !company ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Company not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{company.name}</h3>
                <p className="text-sm text-slate-500 mt-1">TRN: {company.trnNumber || "N/A"}</p>
                <p className="text-sm text-slate-500">Trade License: {company.tradeLicenseNo || "N/A"}</p>
                <p className="text-sm text-slate-500">Establishment Card: {company.establishmentCardNo || "N/A"}</p>
                {(company.email || company.phone) && (
                  <p className="text-sm text-slate-500">{[company.email, company.phone].filter(Boolean).join(" | ")}</p>
                )}
              </div>
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Details
              </button>
            </div>

            {/* MOHRE Quota Meter */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">MOHRE Quota Utilization</span>
                <span className="text-sm font-bold text-indigo-600">{utilization}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">{totalQuota}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Allocated</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{employeeCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Used</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{availableSlots}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Available</p>
                </div>
              </div>
            </div>

            {/* Sponsored Staff */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" /> Sponsored Staff
                </h4>
                <button
                  onClick={() => setIsAddEmployeeOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#98682E] bg-[#98682E]/10 px-2.5 py-1.5 rounded-lg hover:bg-[#98682E]/20 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Employee
                </button>
              </div>

              {employeeCount === 0 ? (
                <p className="text-sm text-slate-500 italic px-2">No employees registered yet.</p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Passport No</th>
                        <th className="px-3 py-2">Visa Status</th>
                        <th className="px-3 py-2">EID Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {company.employees.map((emp: any) => (
                        <tr key={emp.id}>
                          <td className="px-3 py-2 font-medium text-slate-900">{emp.name}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-xs">{emp.passportNo || "N/A"}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {emp.visaStatus || "ACTIVE"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs">
                            {emp.expiryDate ? format(new Date(emp.expiryDate), "dd MMM yyyy") : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Document Vault */}
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" /> Document Vault
              </h4>
              {(!company.vaultDocuments || company.vaultDocuments.length === 0) ? (
                <p className="text-sm text-slate-500 italic px-2">No documents on file yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {company.vaultDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{doc.title}</p>
                        <p className="text-xs text-slate-500">{doc.category}</p>
                      </div>
                      {doc.expiryDate && (
                        <span className="text-xs text-slate-500">{format(new Date(doc.expiryDate), "dd MMM yyyy")}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isEditOpen && company && (
        <EditCompanyModal
          company={company}
          onClose={() => {
            setIsEditOpen(false);
            load();
          }}
        />
      )}
      {isAddEmployeeOpen && (
        <AddEmployeeModal
          corporateId={companyId}
          onClose={() => {
            setIsAddEmployeeOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
