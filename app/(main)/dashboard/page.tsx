import prisma from "@/lib/prisma";
import { getDashboardCounts } from "@/lib/dashboardStats";
import { DailyUrgencyStrip } from "@/components/dashboard/DailyUrgencyStrip";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { ActionChecklist, ChecklistCase } from "@/components/dashboard/ActionChecklist";
import { ExpiryRadarWidget, RadarExpiry } from "@/components/dashboard/ExpiryRadarWidget";
import { LiquiditySnapshot } from "@/components/dashboard/LiquiditySnapshot";
import { DailyTransactionsFeed, type DailyFeedItem } from "@/components/dashboard/DailyTransactionsFeed";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const next30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // "Today" must mean the calendar day in Gulf Standard Time (UTC+4, no DST),
  // not the server process's local time -- Vercel functions run in UTC, so
  // `new Date(y, m, d, 0,0,0,0)` built from a UTC `now` produces UTC midnight,
  // which excludes any transaction recorded between 00:00-03:59 Dubai time
  // (those timestamps are still "yesterday" in UTC).
  const GST_OFFSET_MS = 4 * 60 * 60 * 1000;
  const nowInGst = new Date(now.getTime() + GST_OFFSET_MS);
  const startOfDay = new Date(Date.UTC(nowInGst.getUTCFullYear(), nowInGst.getUTCMonth(), nowInGst.getUTCDate(), 0, 0, 0, 0) - GST_OFFSET_MS);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Fetch all necessary data in a single parallel batch (one round trip to
  // the pooler instead of three sequential ones). If the database is
  // unreachable (cold pooler, network blip, project paused) fall back to
  // empty/zeroed data instead of letting the whole page crash with a 500.
  let dbError = false;
  let wallets: any[] = [];
  let activeCases: any[] = [];
  let upcomingDocs: any[] = [];
  let clients: any[] = [];
  let todayPayments: any[] = [];
  let todayExpenses: any[] = [];

  // The 4 summary counts are cached for 60s (lib/dashboardStats.ts) via a
  // route also exposed at /api/dashboard/stats, so navigating between pages
  // doesn't re-run these on every render and add extra load to the pooler.
  let urgencyData = { criticalExpiries: 0, casesInMedical: 0, pendingApprovals: 0, lowBalanceWallets: 0 };

  try {
    const [
      counts,
      walletsResult,
      activeCasesResult,
      upcomingDocsResult,
      clientsResult,
      todayPaymentsResult,
      todayExpensesResult,
    ] = await Promise.all([
      getDashboardCounts(),
      prisma.portalWallet.findMany(),
      prisma.caseFile.findMany({
        where: {
          stage: { notIn: ["COMPLETED", "COMPLETED_HANDOVER"] }
        },
        include: {
          client: true
        },
        orderBy: {
          stageUpdatedAt: 'desc'
        },
        take: 10
      }),
      prisma.documentVault.findMany({
        where: {
          expiryDate: { lte: next30d, gte: now }
        },
        include: {
          client: true,
          employee: true
        },
        orderBy: {
          expiryDate: 'asc'
        },
        take: 15
      }),
      prisma.client.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transactionPayment.findMany({
        where: { paidAt: { gte: startOfDay, lte: endOfDay } },
        include: { transaction: true },
        orderBy: { paidAt: 'desc' }
      }),
      prisma.transaction.findMany({
        where: { type: 'EXPENSE', date: { gte: startOfDay, lte: endOfDay } },
        orderBy: { date: 'desc' }
      }),
    ]);

    urgencyData = {
      criticalExpiries: counts.criticalDocs,
      casesInMedical: counts.medicalCases,
      pendingApprovals: counts.pendingCases,
      lowBalanceWallets: counts.lowBalanceWallets,
    };
    wallets = walletsResult;
    activeCases = activeCasesResult;
    upcomingDocs = upcomingDocsResult;
    clients = clientsResult;
    todayPayments = todayPaymentsResult;
    todayExpenses = todayExpensesResult;
  } catch (error) {
    console.error("Dashboard: database unreachable, rendering with empty data:", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      error,
    });
    dbError = true;
  }

  const checklistCases: ChecklistCase[] = activeCases.map((c: any) => {
    // Simple SLA logic based on stageUpdatedAt
    const hoursSinceUpdate = (now.getTime() - new Date(c.stageUpdatedAt).getTime()) / (1000 * 60 * 60);
    
    let slaStatus: "OVERDUE" | "DUE_SOON" | "ON_TRACK" = "ON_TRACK";
    let slaText = "On Track";
    
    if (hoursSinceUpdate > 48) {
      slaStatus = "OVERDUE";
      slaText = `Overdue by ${Math.floor(hoursSinceUpdate / 24)}d`;
    } else if (hoursSinceUpdate > 24) {
      slaStatus = "DUE_SOON";
      slaText = `Due in ${Math.floor(48 - hoursSinceUpdate)}h`;
    }

    return {
      id: c.id,
      applicantName: c.applicantName,
      clientName: c.client.name,
      clientId: c.clientId,
      stage: c.stage,
      reference: c.reference,
      phone: c.client.phone,
      slaStatus,
      slaText
    };
  });

  const todayInflowMinor = todayPayments.reduce((sum: number, p: any) => sum + p.amountMinor, 0);
  const todayOutflowMinor = todayExpenses.reduce((sum: number, tx: any) => sum + tx.amountTotal, 0);

  const dailyFeedItems: DailyFeedItem[] = [
    ...todayPayments.map((p: any) => ({
      id: `pay-${p.id}`,
      transactionId: p.transactionId,
      kind: "INCOME" as const,
      title: p.transaction?.counterparty || "Payment Received",
      method: p.method,
      time: p.paidAt,
      amountMinor: p.amountMinor,
    })),
    ...todayExpenses.map((tx: any) => ({
      id: `exp-${tx.id}`,
      transactionId: tx.id,
      kind: "EXPENSE" as const,
      title: tx.counterparty,
      method: tx.paymentMode,
      time: tx.date,
      amountMinor: tx.amountTotal,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const radarExpiries: RadarExpiry[] = upcomingDocs.map((d: any) => {
    const daysRemaining = Math.ceil((new Date(d.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: d.id,
      title: d.title,
      category: d.category,
      clientName: d.client?.name || null,
      employeeName: d.employee?.name || null,
      daysRemaining,
      expiryDate: d.expiryDate!
    };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-24 md:p-8 md:pb-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {dbError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium">
            Couldn't reach the database right now, so this page is showing empty data. It should recover automatically — refresh in a moment.
          </div>
        )}
        <DailyUrgencyStrip data={urgencyData} />
        
        <QuickActionsBar clients={clients} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Action Checklist */}
          <div className="lg:col-span-2">
            <ActionChecklist cases={checklistCases} />
          </div>

          {/* Right Column: Widgets */}
          <div className="flex flex-col gap-6">
            <DailyTransactionsFeed
              inflowMinor={todayInflowMinor}
              outflowMinor={todayOutflowMinor}
              items={dailyFeedItems}
            />
            <div className="flex-1">
              <ExpiryRadarWidget expiries={radarExpiries} />
            </div>
            <div>
              <LiquiditySnapshot balances={wallets} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
