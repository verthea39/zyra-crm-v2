"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";

const DEFAULT_PORTALS = ["MOHRE", "Amer / GDRFA", "ICP Smart Services", "DED / Dubai Economy"];

export async function getWalletStats() {
  try {
    // Ensure default wallets exist
    for (const portal of DEFAULT_PORTALS) {
      await prisma.portalWallet.upsert({
        where: { entityName: portal },
        update: {},
        create: { entityName: portal, balance: 0 }
      });
    }

    const wallets = await prisma.portalWallet.findMany({
      include: {
        transactions: {
          include: {
            client: { select: { name: true } }
          },
          orderBy: { date: 'desc' },
          take: 50 // limit to recent 50 for ledger
        }
      },
      orderBy: { entityName: 'asc' }
    });

    return wallets;
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    return [];
  }
}

export async function createPortalWallet({
  entityName,
  portalType,
  openingBalance,
  lowBalanceThreshold,
  accountNumber,
}: {
  entityName: string;
  portalType?: string;
  openingBalance?: number;
  lowBalanceThreshold?: number;
  accountNumber?: string;
}) {
  try {
    const wallet = await prisma.portalWallet.create({
      data: {
        entityName,
        portalType: portalType || null,
        balance: openingBalance || 0,
        lowBalanceThreshold: lowBalanceThreshold ?? 500,
        accountNumber: accountNumber || null,
      },
    });
    revalidatePath("/portal-wallets");
    revalidatePath("/finance/cockpit");
    return { success: true, wallet };
  } catch (error: any) {
    console.error("Error creating portal wallet:", error);
    return { success: false, error: error.message || "Failed to create portal wallet" };
  }
}

export async function topUpWallet({ walletId, amount, receiptRef, description, date }: { walletId: string, amount: number, receiptRef?: string | null, description?: string, date?: string }) {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const wallet = await tx.portalWallet.findUnique({ where: { id: walletId } });
      if (!wallet) throw new Error("Wallet not found");

      const newBalance = wallet.balance + amount;

      await tx.portalWallet.update({
        where: { id: walletId },
        data: { balance: newBalance, lastTopUpDate: date ? new Date(date) : new Date() }
      });

      const transaction = await tx.portalTransaction.create({
        data: {
          walletId,
          type: "TOP_UP",
          amount,
          balanceAfter: newBalance,
          receiptRef,
          description: description || "Wallet Top-up",
          date: date ? new Date(date) : new Date()
        }
      });

      return { transaction, entityName: wallet.entityName };
    });

    revalidatePath("/portal-wallets");
    revalidatePath("/finance/cockpit");

    await logActivity({
      action: "WALLET_TOPUP",
      title: `${result.entityName} wallet topped up by AED ${amount.toFixed(2)}`,
      details: { walletId, amount, receiptRef },
      entityType: "WALLET",
      entityId: walletId,
    });

    return { success: true, transaction: result.transaction };
  } catch (error: any) {
    console.error("Error topping up wallet:", error);
    return { success: false, error: error.message || "Failed to top up wallet" };
  }
}

export async function deductWallet({
  walletId,
  amount,
  clientId,
  caseRef,
  description,
  receiptRef,
  date
}: {
  walletId: string,
  amount: number,
  clientId?: string | null,
  caseRef?: string | null,
  description: string,
  receiptRef?: string | null,
  date?: string
}) {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const wallet = await tx.portalWallet.findUnique({ where: { id: walletId } });
      if (!wallet) throw new Error("Wallet not found");

      if (wallet.balance < amount) {
        throw new Error("Insufficient balance in wallet");
      }

      const newBalance = wallet.balance - amount;

      await tx.portalWallet.update({
        where: { id: walletId },
        data: { balance: newBalance }
      });

      const dataPayload: any = {
        walletId,
        type: "DEDUCTION",
        amount,
        balanceAfter: newBalance,
        receiptRef,
        description,
        date: date ? new Date(date) : new Date()
      };
      
      if (clientId) dataPayload.clientId = clientId;
      if (caseRef) dataPayload.caseRef = caseRef;

      const transaction = await tx.portalTransaction.create({
        data: dataPayload
      });

      return { transaction, entityName: wallet.entityName };
    });

    revalidatePath("/portal-wallets");
    revalidatePath("/finance/cockpit");

    await logActivity({
      action: "WALLET_DEDUCTION",
      title: `AED ${amount.toFixed(2)} deducted from ${result.entityName} wallet`,
      details: { walletId, amount, description, receiptRef },
      entityType: "WALLET",
      entityId: walletId,
    });

    return { success: true, transaction: result.transaction };
  } catch (error: any) {
    console.error("Error deducting from wallet:", error);
    return { success: false, error: error.message || "Failed to log deduction" };
  }
}
