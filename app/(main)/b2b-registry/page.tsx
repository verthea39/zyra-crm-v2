import { getCorporateClients } from "@/app/actions/b2b";
import { CorporateList } from "@/components/b2b-registry/CorporateList";


export const dynamic = "force-dynamic";
export default async function B2BRegistryPage() {
  const corporates = await getCorporateClients();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#16181D]">
      <div className="p-4 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">B2B Registry</h1>
          <p className="text-slate-500 text-sm">Corporate Hierarchy & MOHRE Quota Tracker</p>
        </div>
        <button className="bg-[#98682E] text-white px-4 py-2 rounded-md font-medium hover:bg-[#98682E]/90 transition">
          + Add Company
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:px-8 pb-8">
        <CorporateList corporates={corporates} />
      </div>
    </div>
  );
}
