import { getCachedDashboardMetrics } from '@/lib/api/dashboard-metrics';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metrics = await getCachedDashboardMetrics();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">CRM Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Pipeline Value</p>
          <p className="text-2xl font-bold mt-2">${metrics.activePipeline.toLocaleString()}</p>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Active Leads</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">
            {metrics.activeLeads}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Urgent Follow-ups</p>
          <p className="text-2xl font-bold mt-2 text-blue-600">
            {metrics.urgentFollowUps}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Win Rate</p>
          <p className="text-2xl font-bold mt-2 text-emerald-600">
            {metrics.winRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
