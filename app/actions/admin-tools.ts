"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { logServerError } from "@/lib/logger";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * There is no login/session system in this app (no NextAuth session is
 * ever established -- see .env). "Who is acting" is instead an explicit
 * selection the caller must pass in (actorUserId), and every destructive
 * action here re-verifies that user's role server-side against the DB
 * rather than trusting anything from the client.
 */
async function requireAdmin(actorUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true, name: true, role: true, isActive: true } });
  if (!user || !user.isActive || !ADMIN_ROLES.includes(user.role)) {
    return { ok: false as const, error: "Only Admin users can perform this action." };
  }
  return { ok: true as const, user };
}

// ---------------------------------------------------------------------------
// Backup / Export
// ---------------------------------------------------------------------------

export async function exportDatabaseBackup(actorUserId: string) {
  const auth = await requireAdmin(actorUserId);
  if (!auth.ok) return { success: false as const, error: auth.error };

  try {
    const [clients, employees, caseFiles, documents, transactions, portalWallets, portalTransactions] = await Promise.all([
      prisma.client.findMany(),
      prisma.employee.findMany(),
      prisma.caseFile.findMany(),
      prisma.document.findMany({ include: { items: true } }),
      prisma.transaction.findMany({ include: { payments: true } }),
      prisma.portalWallet.findMany(),
      prisma.portalTransaction.findMany(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      exportedBy: auth.user.name,
      version: 1,
      data: { clients, employees, caseFiles, documents, transactions, portalWallets, portalTransactions },
    };

    await logActivity({
      action: "DB_BACKUP_EXPORTED",
      title: `Database backup exported by ${auth.user.name}`,
      entityType: "SYSTEM",
    });

    return { success: true as const, backup };
  } catch (error) {
    logServerError(error, { action: "exportDatabaseBackup", userId: actorUserId });
    return { success: false as const, error: "Failed to export backup" };
  }
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

export async function restoreFromBackup(actorUserId: string, backupJson: string) {
  const auth = await requireAdmin(actorUserId);
  if (!auth.ok) return { success: false as const, error: auth.error };

  let parsed: any;
  try {
    parsed = JSON.parse(backupJson);
  } catch {
    return { success: false as const, error: "That file isn't valid JSON" };
  }

  const data = parsed?.data;
  if (!data || typeof data !== "object") {
    return { success: false as const, error: "This doesn't look like a Zyra backup file" };
  }

  try {
    let counts = { clients: 0, employees: 0, caseFiles: 0, documents: 0, transactions: 0, portalWallets: 0 };

    for (const c of data.clients || []) {
      await prisma.client.upsert({ where: { id: c.id }, update: c, create: c });
      counts.clients++;
    }
    for (const e of data.employees || []) {
      await prisma.employee.upsert({ where: { id: e.id }, update: e, create: e });
      counts.employees++;
    }
    for (const cf of data.caseFiles || []) {
      await prisma.caseFile.upsert({ where: { id: cf.id }, update: cf, create: cf });
      counts.caseFiles++;
    }
    for (const doc of data.documents || []) {
      const { items, ...docFields } = doc;
      await prisma.document.upsert({ where: { id: doc.id }, update: docFields, create: docFields });
      for (const item of items || []) {
        await prisma.documentItem.upsert({ where: { id: item.id }, update: item, create: item });
      }
      counts.documents++;
    }
    for (const tx of data.transactions || []) {
      const { payments, ...txFields } = tx;
      await prisma.transaction.upsert({ where: { id: tx.id }, update: txFields, create: txFields });
      for (const p of payments || []) {
        await prisma.transactionPayment.upsert({ where: { id: p.id }, update: p, create: p });
      }
      counts.transactions++;
    }
    for (const w of data.portalWallets || []) {
      await prisma.portalWallet.upsert({ where: { id: w.id }, update: w, create: w });
      counts.portalWallets++;
    }

    revalidatePath("/", "layout");

    await logActivity({
      action: "DB_BACKUP_RESTORED",
      title: `Database restored from backup by ${auth.user.name}`,
      details: counts,
      entityType: "SYSTEM",
    });

    return { success: true as const, counts };
  } catch (error) {
    logServerError(error, { action: "restoreFromBackup", userId: actorUserId });
    return { success: false as const, error: "Restore failed partway through -- some records may already be updated. Check the activity log and re-export a fresh backup before retrying." };
  }
}

// ---------------------------------------------------------------------------
// Reset to Clean Demo State
// ---------------------------------------------------------------------------

const DEMO_WALLET_BALANCES: Record<string, number> = {
  "Amer / GDRFA": 8000,
  "DED / Dubai Economy": 12000,
  "ICP Smart Services": 6000,
  MOHRE: 5000,
};

export async function resetToCleanDemoState(actorUserId: string, confirmText: string) {
  const auth = await requireAdmin(actorUserId);
  if (!auth.ok) return { success: false as const, error: auth.error };

  if (confirmText !== "RESET") {
    return { success: false as const, error: 'You must type "RESET" exactly to confirm.' };
  }

  try {
    // Wipe operational data only -- User/CompanySettings/ServiceItem are
    // never touched, matching this app's established preservation rule.
    await prisma.whatsAppLog.deleteMany();
    await prisma.document.deleteMany(); // cascades DocumentItem
    await prisma.caseFile.deleteMany(); // cascades DocumentChecklist
    await prisma.transaction.deleteMany(); // cascades TransactionPayment
    await prisma.portalTransaction.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.client.deleteMany();
    await prisma.activityLog.deleteMany();

    const coordinator = auth.user;

    // 2 B2B companies with MOHRE quota
    const companyA = await prisma.client.create({
      data: { type: "CORPORATE", name: "Apex Tech LLC", tradeLicenseNo: "TL-DEMO-001", trnNumber: "100000000000001", mohreQuotaTotal: 25, phone: "0507654321" },
    });
    const companyB = await prisma.client.create({
      data: { type: "CORPORATE", name: "Roofers Technical Services", tradeLicenseNo: "TL-DEMO-002", trnNumber: "100000000000002", mohreQuotaTotal: 15, phone: "0501112223" },
    });
    await prisma.employee.createMany({
      data: [
        { corporateId: companyA.id, name: "Rahim Uddin", designation: "Technician", visaStatus: "ACTIVE" },
        { corporateId: companyB.id, name: "Faisal Ahmed", designation: "Site Supervisor", visaStatus: "ACTIVE" },
      ],
    });

    // 3 individual visa cases with standard preset line items
    const demoIndividuals = [
      { name: "Mohamed Al-Hashimi", phone: "0501234567", serviceType: "Visa Renewal", stage: "OFFER_LETTER_MOHRE" as const },
      { name: "Fatima Noor", phone: "0509876543", serviceType: "New Employment Visa", stage: "SUBMITTED" as const },
      { name: "Sara Al-Blooshi", phone: "0505554443", serviceType: "Family Visa", stage: "DRAFT_INTAKE" as const },
    ];

    for (const person of demoIndividuals) {
      const client = await prisma.client.create({ data: { type: "INDIVIDUAL", name: person.name, phone: person.phone } });
      await prisma.caseFile.create({
        data: {
          reference: `CASE-DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          applicantName: person.name,
          serviceType: person.serviceType,
          stage: person.stage,
          clientId: client.id,
          coordinatorId: coordinator.id,
        },
      });

      const govFee = 220000; // AED 2,200.00 minor units
      const serviceFee = 80000; // AED 800.00 minor units
      await prisma.document.create({
        data: {
          reference: `QT-DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          type: "QUOTATION",
          clientId: client.id,
          subtotalMinor: govFee + serviceFee,
          discountMinor: 0,
          vatRate: 5,
          vatMinor: Math.round(serviceFee * 0.05),
          totalMinor: govFee + serviceFee + Math.round(serviceFee * 0.05),
          items: {
            create: [
              { description: "Government Fee", quantity: 1, unitPriceMinor: govFee, lineTotalMinor: govFee, vatExempt: true },
              { description: "Service Charge", quantity: 1, unitPriceMinor: serviceFee, lineTotalMinor: serviceFee, vatExempt: false },
            ],
          },
        },
      });
    }

    // Active portal wallet balances
    const wallets = await prisma.portalWallet.findMany();
    for (const w of wallets) {
      const balance = DEMO_WALLET_BALANCES[w.entityName] ?? 5000;
      await prisma.portalWallet.update({ where: { id: w.id }, data: { balance, lastTopUpDate: new Date() } });
    }

    revalidatePath("/", "layout");

    await logActivity({
      action: "DB_RESET_TO_DEMO",
      title: `Database reset to clean demo state by ${auth.user.name}`,
      entityType: "SYSTEM",
    });

    return { success: true as const };
  } catch (error) {
    logServerError(error, { action: "resetToCleanDemoState", userId: actorUserId });
    return { success: false as const, error: "Reset failed partway through. Restore from your pre-reset backup and contact support." };
  }
}
