import { getServiceItems, getCompanySettings, getTeamUsers } from "@/app/actions/settings";
import { SettingsClientView } from "@/components/settings/SettingsClientView";


export const dynamic = "force-dynamic";
export const metadata = {
  title: "Settings - Zyra CRM",
};

export default async function SettingsPage() {

  // Fetch all necessary data Server-Side
  const [services, team, companySettings] = await Promise.all([
    getServiceItems(),
    getTeamUsers(),
    getCompanySettings()
  ]);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configuration & Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage rates, permissions, and corporate profiles.</p>
        </div>
      </header>
      
      <div className="flex-1 p-6 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
        <SettingsClientView 
          services={services} 
          team={team} 
          companySettings={companySettings} 
        />
      </div>
    </div>
  );
}
