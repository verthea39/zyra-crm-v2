'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { transactionInputSchema } from '@/lib/validations/finance';
import { recordAuditEntry } from '@/lib/finance-audit';
import { AuditAction } from '@prisma/client';
import { sendPaymentReminder } from '@/lib/services/notifications';

export async function createClient(formData: FormData) {
  const profileType = formData.get('profileType') as 'CORPORATE' | 'INDIVIDUAL';
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;

  await prisma.client.create({
    data: {
      clientType: profileType,
      corporateProfile:
        profileType === 'CORPORATE'
          ? {
              create: {
                companyNameEn: name,
                contactEmail: email,
                authorizedSignatoryMobile: phone,
                tradeLicenseNumber: `TMP-${Date.now()}`,
                issuingAuthority: 'TBD'
              },
            }
          : undefined,
      individualProfile:
        profileType === 'INDIVIDUAL'
          ? {
              create: {
                fullNameEn: name,
                email: email,
                mobileNumber: phone,
                passportNumber: `TMP-${Date.now()}`,
                nationality: 'TBD'
              },
            }
          : undefined,
    },
  });

  revalidatePath('/');
  return { success: true };
}

export async function createTransaction(formData: FormData) {
  const refId = formData.get('refId') as string;
  const type = formData.get('type') as 'INCOME' | 'EXPENSE';
  const clientId = formData.get('clientId') as string;
  const counterpartyName = formData.get('counterpartyName') as string;
  const category = formData.get('category') as string;
  const totalAmount = parseFloat(formData.get('totalAmount') as string) || 0;
  const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0;
  const dueDateStr = formData.get('dueDate') as string;

  const status =
    paidAmount >= totalAmount
      ? 'PAID'
      : new Date(dueDateStr) < new Date()
      ? 'OVERDUE'
      : 'PENDING';

  const newTxn = await (prisma as any).ledgerTransaction.create({
    data: {
      referenceId: refId,
      type,
      clientId: clientId || null,
      counterpartyName,
      counterpartyPhone: null,
      category,
      totalAmountMinor: BigInt(Math.round(totalAmount * 100)),
      paidAmountMinor: BigInt(Math.round(paidAmount * 100)),
      status,
      transactionDate: new Date(),
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
  });

  await recordAuditEntry({
    transactionId: newTxn.id,
    actorEmail: 'system@zyracrm.local', // Placeholder until auth context is integrated
    action: AuditAction.CREATE,
    newPayload: { refId, totalAmount, paidAmount, status },
  });

  revalidatePath('/finance/cockpit');
  return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
  const counterpartyName = formData.get('counterpartyName') as string;
  const category = formData.get('category') as string;
  const totalAmount = parseFloat(formData.get('totalAmount') as string) || 0;
  const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0;
  const dueDateStr = formData.get('dueDate') as string;

  const status =
    paidAmount >= totalAmount
      ? 'PAID'
      : new Date(dueDateStr) < new Date()
      ? 'OVERDUE'
      : 'PENDING';

  const updatedTxn = await (prisma as any).ledgerTransaction.update({
    where: { id },
    data: {
      counterpartyName,
      category,
      totalAmountMinor: BigInt(Math.round(totalAmount * 100)),
      paidAmountMinor: BigInt(Math.round(paidAmount * 100)),
      status,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
  });

  await recordAuditEntry({
    transactionId: updatedTxn.id,
    actorEmail: 'system@zyracrm.local',
    action: AuditAction.UPDATE,
    newPayload: { totalAmount, paidAmount, status },
  });

  revalidatePath('/finance/cockpit');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const deletedTxn = await (prisma as any).ledgerTransaction.delete({
    where: { id },
  });

  await recordAuditEntry({
    transactionId: deletedTxn.id,
    actorEmail: 'system@zyracrm.local',
    action: AuditAction.DELETE,
    previousPayload: { refId: deletedTxn.referenceId },
  });

  revalidatePath('/finance/cockpit');
  return { success: true };
}

export async function dispatchReminderAction(transactionId: string, channel: 'WHATSAPP' | 'EMAIL') {
  const tx = await (prisma as any).ledgerTransaction.findUnique({
    where: { id: transactionId },
    include: {
      client: {
        include: {
          corporateProfile: true,
          individualProfile: true,
        },
      },
    },
  });

  if (!tx) {
    throw new Error('Transaction record not found.');
  }

  const recipientName =
    tx.client?.corporateProfile?.companyNameEn ||
    tx.client?.individualProfile?.fullNameEn ||
    tx.counterpartyName;

  const recipientContact =
    channel === 'WHATSAPP'
      ? tx.client?.corporateProfile?.authorizedSignatoryMobile ||
        tx.client?.individualProfile?.mobileNumber ||
        tx.counterpartyPhone
      : tx.client?.corporateProfile?.contactEmail ||
        tx.client?.individualProfile?.email;

  if (!recipientContact) {
    return {
      success: false,
      error: `Missing recipient ${channel.toLowerCase()} contact details.`,
    };
  }

  const result = await sendPaymentReminder({
    transactionId: tx.id,
    recipientName,
    recipientContact,
    amountDue: Number(tx.balanceAmountMinor) / 100, // Convert fils to standard AED
    currency: tx.currency,
    dueDate: tx.dueDate ? new Date(tx.dueDate).toLocaleDateString('en-GB') : 'Immediate',
    referenceId: tx.referenceId,
    channel,
  });

  revalidatePath('/finance/cockpit');
  return result;
}
