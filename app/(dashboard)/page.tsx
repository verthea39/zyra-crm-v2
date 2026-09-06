import { Briefcase, CalendarClock, MapPinned, Wallet } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpiryAlertsWidget } from "@/components/dashboard/ExpiryAlertsWidget";
import { TodayTasksWidget } from "@/components/dashboard/TodayTasksWidget";
import { ActiveWorkflowsWidget } from "@/components/dashboard/ActiveWorkflowsWidget";
import { getDashboardMetrics, getExpiryAlerts, getTodaysFieldTasks, getActiveWorkflows } from "@/lib/dashboard";
import { formatAED } from "@/lib/utils";

export const dynamic = "force-dynamic"; // always reflect live case/expiry counts

export default async function DashboardOverviewPage() {
  const [metrics, expiryAlerts, fieldTasks, activeWorkflows] = await Promise.all([
    getDashboardMetrics(),
    getExpiryAlerts(),
    getTodaysFieldTasks(),
    getActiveWorkflows(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of active cases, expiring documents, field tasks, and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Active Cases"
          value={metrics.totalActiveCases}
          icon={Briefcase}
          tone="default"
        />
        <StatsCard
          label="Expiring Visas & Licenses"
          value={metrics.expiringNext30Days}
          hint={`${metrics.expiringNext60Days} due within 60 days`}
          icon={CalendarClock}
          tone="warning"
        />
        <StatsCard
          label="Today's Field PRO Tasks"
          value={metrics.todaysFieldTasks}
          icon={MapPinned}
          tone="default"
        />
        <StatsCard
          label="Daily Revenue"
          value={formatAED(metrics.dailyRevenueAED)}
          icon={Wallet}
          tone="success"
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
