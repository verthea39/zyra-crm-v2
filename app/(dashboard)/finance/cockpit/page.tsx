import { getCockpitKPIs, getLedgerTransactions, getCockpitClients } from '@/app/actions/cockpit';
import { DashboardClient } from '@/components/cockpit/dashboard-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Main Dashboard Page
export default async function CockpitDashboardPage() {
  const transactions = await getLedgerTransactions();
  const clients = await getCockpitClients();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <Suspense fallback={<div className="p-10">Loading cockpit data...</div>}>
        <DashboardClient
          initialTransactions={transactions}
          clients={clients}
        />
      </Suspense>
    </div>
  );
}
