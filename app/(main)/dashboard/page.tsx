import prisma from "@/lib/prisma";
import { DailyUrgencyStrip } from "@/components/dashboard/DailyUrgencyStrip";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { ActionChecklist, ChecklistCase } from "@/components/dashboard/ActionChecklist";
import { ExpiryRadarWidget, RadarExpiry } from "@/components/dashboard/ExpiryRadarWidget";
import { LiquiditySnapshot } from "@/components/dashboard/LiquiditySnapshot";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const next30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch all necessary data in parallel
  const [
    criticalDocs,
    medicalCases,
    pendingCases,
    wallets,
    activeCases,
    upcomingDocs,
    clients
  ] = await Promise.all([
    prisma.documentVault.count({
      where: {
        expiryDate: { lte: next48h, gte: now }
      }
    }),
    prisma.caseFile.count({
      where: { stage: "MEDICAL_BIOMETRICS" }
    }),
    prisma.caseFile.count({
      where: { stage: "SUBMITTED" }
    }),
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
    })
  ]);

  const lowBalanceWallets = wallets.filter((w: any) => w.balance < 2000).length;

  const urgencyData = {
    criticalExpiries: criticalDocs,
    casesInMedical: medicalCases,
    pendingApprovals: pendingCases,
    lowBalanceWallets
  };

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
      stage: c.stage,
      reference: c.reference,
      phone: c.client.phone,
      slaStatus,
      slaText
    };
  });

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
        <DailyUrgencyStrip data={urgencyData} />
        
        <QuickActionsBar clients={clients} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Action Checklist */}
          <div className="lg:col-span-2">
            <ActionChecklist cases={checklistCases} />
          </div>

          {/* Right Column: Widgets */}
          <div className="flex flex-col gap-6">
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
