"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Plus, FileText, CheckCircle2 } from "lucide-react";
import { KanbanBoard } from "./KanbanBoard";
import { NewCaseModal } from "./NewCaseModal";

export function PipelineClientView({ initialCases, clients, coordinators }: { initialCases: any[], clients: any[], coordinators: any[] }) {
  const [cases, setCases] = useState(initialCases);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSponsor, setFilterSponsor] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCases = useMemo(() => {
    return cases.filter((c: any) => {
      const matchesSearch = 
        c.applicantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesSponsor = filterSponsor ? c.client?.name === filterSponsor : true;

      return matchesSearch && matchesSponsor;
    });
  }, [cases, searchQuery, filterSponsor]);

  // Extract unique sponsors for the filter
  const uniqueSponsors = useMemo(() => {
    const sponsors = new Set(cases.map((c: any) => c.client?.name).filter(Boolean));
    return Array.from(sponsors);
  }, [cases]);

  return (
    <>
      {/* Top Action Header */}
      <div className="p-4 md:px-8 md:py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white  border-b ">
        <div className="flex-1 w-full md:w-auto">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900  flex items-center gap-2">
            Application Pipeline
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage ongoing visa and clearance cases</p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ref, applicant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100  border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg text-sm transition-all"
            />
          </div>
          
          <div className="relative flex-1 sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterSponsor}
              onChange={(e) => setFilterSponsor(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100  border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg text-sm appearance-none cursor-pointer"
            >
              <option value="">All Sponsors</option>
              {uniqueSponsors.map(sponsor => (
                <option key={sponsor as string} value={sponsor as string}>{sponsor}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#98682E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#98682E]/90 transition shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:px-8 pb-8 flex flex-col">
        <KanbanBoard cases={filteredCases} onCasesChange={setCases} />
      </div>

      {isModalOpen && (
        <NewCaseModal 
          onClose={() => setIsModalOpen(false)} 
          clients={clients} 
          coordinators={coordinators} 
        />
      )}
    </>
  );
}
