import { getWalletStats } from "@/app/actions/wallets";
import prisma from "@/lib/prisma";
import { WalletLedger } from "@/components/wallets/WalletLedger";
import { Landmark, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";


export const dynamic = "force-dynamic";
async function getClients() {
  return await prisma.client.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  });
}

export default async function PortalWalletsPage() {
  const wallets = await getWalletStats();
  const clients = await getClients();

  const totalLiquidity = wallets.reduce((acc: number, w: any) => acc + w.balance, 0);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="p-4 md:px-8 md:py-6 border-b border-slate-200 bg-white shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2 uppercase">
              <Landmark className="w-6 h-6 text-[#98682E]" />
              Government Portal Wallets
            </h1>
            <p className="text-slate-500 text-sm mt-1">Live prepayment ledger and Top-up management</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Liquidity</p>
            <p className="text-2xl font-bold text-[#0F172A]">AED {totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallets.map((w: any) => {
            const isLow = w.balance < 2000;
            return (
              <div key={w.id} className={`border rounded-xl p-4 flex flex-col justify-between shadow-sm transition-colors ${isLow ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">{w.entityName}</h3>
                  {isLow ? (
                    <span className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      <AlertCircle className="w-3 h-3" /> Low
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Healthy
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0F172A]">AED {w.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:px-8 pb-8 flex flex-col">
        <WalletLedger wallets={wallets} clients={clients} />
      </div>
    </div>
  );
}
