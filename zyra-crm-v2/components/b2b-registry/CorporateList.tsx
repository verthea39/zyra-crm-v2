"use client";

import { Building2, Users, Briefcase, Plus } from "lucide-react";

export function CorporateList({ corporates }: { corporates: any[] }) {
  if (corporates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed rounded-xl ">
        <Building2 className="w-12 h-12 mb-4 text-slate-300 " />
        <p>No corporate clients found in the registry.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {corporates.map(corp => {
        const employeeCount = corp.employees?.length || 0;
        // Mock quota for demonstration
        const totalQuota = Math.max(employeeCount + 5, 20); 
        const utilization = Math.round((employeeCount / totalQuota) * 100);

        return (
          <div key={corp.id} className="bg-white  border  rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 border-b  bg-slate-50/50  flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600 " />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900  leading-none mb-1">
                    {corp.name}
                  </h3>
                  <p className="text-sm text-slate-500">TRN: {corp.tradeLicenseNo || "N/A"}</p>
                </div>
              </div>
              <button className="text-sm font-medium bg-slate-100  px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
                View Profile
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700 ">MOHRE Quota Utilization</span>
                  <span className="text-sm font-bold text-indigo-600 ">{utilization}%</span>
                </div>
                <div className="w-full bg-slate-100  h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all" 
                    style={{ width: `${utilization}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{employeeCount} Active Visas</span>
                  <span>{totalQuota} Total Quota</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-slate-400" />
                  Sponsored Staff
                </h4>
                
                {employeeCount === 0 ? (
                  <p className="text-sm text-slate-500 italic px-2">No employees registered yet.</p>
                ) : (
                  <div className="border  rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50  text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Employee Name</th>
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y ">
                        {corp.employees.slice(0, 5).map((emp: any) => (
                          <tr key={emp.id} className="hover:bg-slate-50  transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 ">{emp.name}</td>
                            <td className="px-4 py-3 text-slate-500">{emp.designation || 'N/A'}</td>
                            <td className="px-4 py-3 text-right">
                              <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#98682E] bg-[#98682E]/10 px-2 py-1 rounded hover:bg-[#98682E]/20 transition-colors">
                                <Plus className="w-3 h-3" /> Case
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
