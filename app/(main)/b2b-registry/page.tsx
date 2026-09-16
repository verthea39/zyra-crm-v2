import { getCorporateClients } from "@/app/actions/b2b";
import { CorporateList } from "@/components/b2b-registry/CorporateList";
import { B2BRegistryHeader } from "@/components/b2b-registry/B2BRegistryHeader";

export const dynamic = "force-dynamic";
export default async function B2BRegistryPage() {
  const corporates = await getCorporateClients();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#16181D]">
      <B2BRegistryHeader />

      <div className="flex-1 overflow-y-auto p-4 md:px-8 pb-8">
        <CorporateList corporates={corporates} />
      </div>
    </div>
  );
}
