import { getActiveCasesForHub, getDispatchHistory } from "@/app/actions/client-hub";
import { WhatsAppDispatcher } from "@/components/client-hub/WhatsAppDispatcher";
import { MessageCircle, History } from "lucide-react";
import { format } from "date-fns";


export const dynamic = "force-dynamic";
export default async function ClientHubPage() {
  const [activeCases, dispatchHistory] = await Promise.all([
    getActiveCasesForHub(),
    getDispatchHistory(),
  ]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#16181D]">
      <div className="p-4 md:px-8 md:py-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
          Client Portal & WhatsApp Hub
        </h1>
        <p className="text-slate-500 text-sm mt-1">Automated status notifications and tracking links</p>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:px-8 pb-8 flex flex-col md:flex-row gap-6">
        {/* Left Side: Dispatcher */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <WhatsAppDispatcher cases={activeCases} />
        </div>

        {/* Right Side: History */}
        <div className="w-full md:w-96 flex flex-col bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl overflow-hidden shadow-sm shrink-0">
          <div className="p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Dispatch History</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {dispatchHistory.length === 0 ? (
              <p className="text-center text-sm text-slate-500 italic py-8">No messages sent yet.</p>
            ) : (
              dispatchHistory.map((log: any) => (
                <div key={log.id} className="relative pl-4 border-l-2 border-[#25D366]/30 py-1">
                  <div className="absolute w-2 h-2 rounded-full bg-[#25D366] -left-[5px] top-2" />
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate pr-2">
                      {log.client?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                      {format(new Date(log.sentAt), "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Template: <span className="text-[#98682E]">{log.templateType}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-500 font-mono">Case: {log.caseFile?.reference}</span>
                    <span className="text-[10px] text-slate-400">By {log.sentBy?.name || 'System'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
