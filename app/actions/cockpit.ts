'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CockpitTxn = {
  type: string;
  status: string;
  totalAmountMinor: bigint;
  paidAmountMinor: bigint;
};

export async function getCockpitKPIs() {
  try {
    const transactions = (await (prisma as any).ledgerTransaction.findMany({
      select: {
        type: true,
        status: true,
        totalAmountMinor: true,
        paidAmountMinor: true,
      },
    })) as CockpitTxn[];

    let revenue = 0n;
    let expenses = 0n;
    let receivables = 0n;
    let payables = 0n;

    for (const txn of transactions) {
      const totalAmount = BigInt(txn.totalAmountMinor);
      const paidAmount = BigInt(txn.paidAmountMinor);
      
      if (txn.type === 'INCOME') {
        revenue += totalAmount;
        if (txn.status !== 'PAID' && txn.status !== 'CANCELLED') {
          receivables += (totalAmount - paidAmount);
        }
      } else if (txn.type === 'EXPENSE') {
        expenses += totalAmount;
        if (txn.status !== 'PAID' && txn.status !== 'CANCELLED') {
          payables += (totalAmount - paidAmount);
        }
      }
    }

    const netProfit = revenue - expenses;

    return {
      revenue: Number(revenue) / 100,
      expenses: Number(expenses) / 100,
      netProfit: Number(netProfit) / 100,
      receivables: Number(receivables) / 100,
      payables: Number(payables) / 100,
    };
  } catch (error) {
    console.error('Error fetching cockpit KPIs:', error);
    throw new Error('Failed to fetch KPIs');
  }
}

type LedgerTxn = {
  id: string;
  referenceId: string;
  transactionDate: Date;
  counterpartyName: string;
  counterpartyPhone: string | null;
  category: string;
  totalAmountMinor: bigint;
  paidAmountMinor: bigint;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID' | 'CANCELLED';
  dueDate: Date | null;
  type: 'INCOME' | 'EXPENSE';
  client: { name: string; email: string | null; phone: string | null } | null;
};

export async function getLedgerTransactions() {
  try {
    const transactions = (await (prisma as any).ledgerTransaction.findMany({
      include: {
        client: {
          include: {
            corporateProfile: {
              select: { companyNameEn: true, authorizedSignatoryMobile: true, contactEmail: true },
            },
            individualProfile: {
              select: { fullNameEn: true, mobileNumber: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as LedgerTxn[];

    return transactions.map((tx: any) => {
      const corporate = tx.client?.corporateProfile;
      const individual = tx.client?.individualProfile;

      const clientName =
        corporate?.companyNameEn ||
        individual?.fullNameEn ||
        tx.counterpartyName || 
        'Unknown Counterparty';

      const clientPhone =
        corporate?.authorizedSignatoryMobile ||
        individual?.mobileNumber ||
        tx.counterpartyPhone ||
        null;

      const clientEmail =
        corporate?.contactEmail ||
        individual?.email ||
        null;

      return {
        id: tx.id,
        refId: tx.referenceId,
        type: tx.type, 
        date: new Date(tx.transactionDate).toLocaleDateString('en-GB'),
        clientName,
        clientPhone,
        clientEmail,
        category: tx.category,
        total: Number(tx.totalAmountMinor) / 100,
        paid: Number(tx.paidAmountMinor) / 100,
        balance: Number(BigInt(tx.totalAmountMinor) - BigInt(tx.paidAmountMinor)) / 100,
        status: tx.status,
        dueDate: tx.dueDate ? new Date(tx.dueDate).toLocaleDateString('en-GB') : '—',
      };
    });
  } catch (error) {
    console.error('Error fetching ledger transactions:', error);
    throw new Error('Failed to fetch ledger transactions');
  }
}

export async function getCockpitClients() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        corporateProfile: { select: { companyNameEn: true } },
        individualProfile: { select: { fullNameEn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return clients.map(c => ({
      id: c.id,
      name: c.corporateProfile?.companyNameEn || c.individualProfile?.fullNameEn || 'Unknown Client'
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}

export async function createLedgerTransaction(data: {
  referenceId: string;
  clientId: string | null;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  totalAmount: number;
  paidAmount: number;
  transactionDate: Date;
  dueDate: Date | null;
  notes: string;
}) {
  try {
    const totalAmountMinor = BigInt(Math.round(data.totalAmount * 100));
    const paidAmountMinor = BigInt(Math.round(data.paidAmount * 100));
    
    let status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID' = 'PENDING';
    if (paidAmountMinor >= totalAmountMinor) status = 'PAID';
    else if (paidAmountMinor > 0n) status = 'PARTIALLY_PAID';
    else if (data.dueDate && new Date(data.dueDate) < new Date()) status = 'OVERDUE';

    await (prisma as any).ledgerTransaction.create({
      data: {
        referenceId: data.referenceId,
        clientId: data.clientId || null,
        counterpartyName: 'N/A', // fallback if no client
        type: data.type,
        category: data.category,
        totalAmountMinor,
        paidAmountMinor,
        status,
        transactionDate: data.transactionDate,
        dueDate: data.dueDate,
        notes: data.notes,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }
}
