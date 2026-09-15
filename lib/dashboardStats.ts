import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * Cheap counts shown at the top of the Dashboard. Wrapped in unstable_cache
 * (60s) so navigating between pages doesn't re-run 4 extra queries against
 * the pooler on every single render -- that repeated load is what tips an
 * already-strained PgBouncer pool into "can't reach database server".
 */
export const getDashboardCounts = unstable_cache(
  async () => {
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const [criticalDocs, medicalCases, pendingCases, wallets] = await Promise.all([
      prisma.documentVault.count({
        where: { expiryDate: { lte: next48h, gte: now } },
      }),
      prisma.caseFile.count({ where: { stage: "MEDICAL_BIOMETRICS" } }),
      prisma.caseFile.count({ where: { stage: "SUBMITTED" } }),
      prisma.portalWallet.findMany({ select: { balance: true, lowBalanceThreshold: true } }),
    ]);

    const lowBalanceWallets = wallets.filter((w) => w.balance <= (w.lowBalanceThreshold ?? 500)).length;

    return { criticalDocs, medicalCases, pendingCases, lowBalanceWallets };
  },
  ["dashboard-counts"],
  { revalidate: 60, tags: ["dashboard-counts"] }
);
