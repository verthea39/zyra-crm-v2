"use client";

import { useState } from "react";
import { AddCompanyModal } from "./AddCompanyModal";

export function B2BRegistryHeader() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="p-4 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">B2B Registry</h1>
        <p className="text-slate-500 text-sm">Corporate Hierarchy & MOHRE Quota Tracker</p>
      </div>
      <button
        onClick={() => setIsAddOpen(true)}
        className="w-full sm:w-auto bg-[#98682E] text-white px-4 py-2 rounded-md font-medium hover:bg-[#98682E]/90 transition"
      >
        + Add Company
      </button>

      {isAddOpen && <AddCompanyModal onClose={() => setIsAddOpen(false)} />}
    </div>
  );
}
