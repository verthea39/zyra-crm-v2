import { getServiceItems, getCompanySettings, getTeamUsers } from "@/app/actions/settings";
import { getRecentActivity } from "@/lib/activity";
import { SettingsClientView } from "@/components/settings/SettingsClientView";


export const dynamic = "force-dynamic";
export const metadata = {
  title: "Settings - Zyra CRM",
};

export default async function SettingsPage() {

  // Fetch all necessary data Server-Side
  const [services, team, companySettings, activity] = await Promise.all([
    getServiceItems(),
    getTeamUsers(),
    getCompanySettings(),
    getRecentActivity(50),
  ]);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Configuration & Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage rates, permissions, and corporate profiles.</p>
        </div>
      </header>

      <div className="flex-1 w-full min-w-0 px-4 py-3 sm:px-6 sm:py-6 overflow-hidden overflow-x-hidden flex flex-col max-w-7xl mx-auto">
        <SettingsClientView
          services={services}
          team={team}
          companySettings={companySettings}
          activity={activity as any}
        />
      </div>
    </div>
  );
}
