import { getVaultDocuments } from "@/app/actions/vault";
import prisma from "@/lib/prisma";
import { VaultView } from "@/components/vault/VaultView";
import { ShieldAlert, ShieldCheck, Files } from "lucide-react";

async function getClientsForUpload() {
  return await prisma.client.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  });
}

export default async function VaultPage() {
  const documents = await getVaultDocuments();
  const clients = await getClientsForUpload();

  const now = new Date();
  
  let criticalCount = 0;
  let dueSoonCount = 0;
  
  documents.forEach((doc: any) => {
    if (!doc.expiryDate) return;
    const daysLeft = Math.floor((new Date(doc.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (daysLeft <= 15) {
      criticalCount++;
    } else if (daysLeft > 15 && daysLeft <= 30) {
      dueSoonCount++;
    }
  });

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="p-4 md:px-8 md:py-6 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0F172A] mb-4 md:mb-6 uppercase">
          Document Vault & Expiry Radar
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Critical Expiries</p>
              <h2 className="text-2xl font-bold text-rose-700">
                {criticalCount} <span className="text-sm font-normal text-rose-600/70">(&lt; 15 days)</span>
              </h2>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Due for Renewal</p>
              <h2 className="text-2xl font-bold text-amber-700">
                {dueSoonCount} <span className="text-sm font-normal text-amber-600/70">(15-30 days)</span>
              </h2>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 text-[#0F172A] rounded-full flex items-center justify-center shrink-0">
              <Files className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Vault Documents</p>
              <h2 className="text-2xl font-bold text-[#0F172A]">{documents.length}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:px-8 pb-8 flex flex-col">
        <VaultView initialDocuments={documents} clients={clients} />
      </div>
    </div>
  );
}
