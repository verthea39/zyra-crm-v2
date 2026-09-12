import { Briefcase, Activity, AlertTriangle, CheckSquare, DollarSign, Target, PieChart, Users } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpiryAlertsWidget } from "@/components/dashboard/ExpiryAlertsWidget";
import { TodayTasksWidget } from "@/components/dashboard/TodayTasksWidget";
import { ActiveWorkflowsWidget } from "@/components/dashboard/ActiveWorkflowsWidget";
import { QuickTransactionButtons } from "@/components/dashboard/QuickTransactionButtons";
import { getExpiryAlerts, getTodaysFieldTasks, getActiveWorkflows } from "@/lib/dashboard";
import { getCachedDashboardMetrics } from '@/lib/api/dashboard-metrics';
import { formatAED } from "@/lib/utils";

export const dynamic = "force-dynamic"; // always reflect live case/expiry counts

export default async function DashboardOverviewPage() {
  const [metrics, expiryAlerts, fieldTasks, activeWorkflows] = await Promise.all([
    getCachedDashboardMetrics(),
    getExpiryAlerts(),
    getTodaysFieldTasks(),
    getActiveWorkflows(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Live snapshot of active cases, expiring documents, field tasks, and revenue.
          </p>
        </div>
        <QuickTransactionButtons />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          label="Pipeline Value"
          value={formatAED(metrics.activePipeline)}
          icon={DollarSign}
          tone="success"
        />
        <StatsCard
          label="Active Leads"
          value={metrics.activeLeads}
          icon={Target}
          tone="default"
        />
        <StatsCard
          label="Win Rate"
          value={`${metrics.winRate}%`}
          icon={PieChart}
          tone="default"
        />
        <StatsCard
          label="Urgent Follow-ups"
          value={metrics.urgentFollowUps}
          icon={CheckSquare}
          tone="warning"
        />
        <StatsCard
          label="Compliance Alerts"
          value={metrics.complianceAlerts}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActiveWorkflowsWidget rows={activeWorkflows} />
        <ExpiryAlertsWidget rows={expiryAlerts} />
        <TodayTasksWidget rows={fieldTasks} />
      </div>
    </div>
  );
}
