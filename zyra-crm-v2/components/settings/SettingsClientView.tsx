"use client";

import { useState } from "react";
import { LayoutList, Users, Building2, ShieldCheck } from "lucide-react";
import { ServicesTab } from "./ServicesTab";
import { TeamTab } from "./TeamTab";
import { CompanyTab } from "./CompanyTab";
import { SecurityTab } from "./SecurityTab";

type SettingsTab = 'services' | 'team' | 'company' | 'security';

export function SettingsClientView({ 
  services = [], 
  team = [], 
  companySettings = {} 
}: { 
  services: any[], 
  team: any[], 
  companySettings: any 
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('services');

  const tabs = [
    { id: "services", label: "Service Catalog", icon: LayoutList },
    { id: "team", label: "Team & Roles", icon: Users },
    { id: "company", label: "Company Profile", icon: Building2 },
    { id: "security", label: "Security & PIN", icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl w-fit border border-slate-200 shadow-sm shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-all rounded-lg ${
                isActive 
                  ? "bg-[#FDF8F0] border border-[#98682E] text-[#98682E] shadow-xs font-semibold" 
                  : "bg-transparent border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#98682E]" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {activeTab === 'services' && <ServicesTab initialServices={services} />}
        {activeTab === 'team' && <TeamTab initialUsers={team} />}
        {activeTab === 'company' && <CompanyTab initialSettings={companySettings} />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}
