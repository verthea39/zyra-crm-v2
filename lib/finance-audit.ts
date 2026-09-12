import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

interface AuditParams {
  transactionId: string;
  actorEmail: string;
  action: AuditAction;
  previousPayload?: Record<string, unknown> | null;
  newPayload?: Record<string, unknown> | null;
}

export async function recordAuditEntry({
  transactionId,
  actorEmail,
  action,
  previousPayload,
  newPayload,
}: AuditParams) {
  try {
    // Note: We use financeAuditLog here because we explicitly named it 
    // FinanceAuditLog in the schema to avoid conflicts with the generic AuditLog.
    await prisma.financeAuditLog.create({
      data: {
        transactionId,
        actorEmail,
        action,
        previousPayload: previousPayload ? JSON.parse(JSON.stringify(previousPayload)) : undefined,
        newPayload: newPayload ? JSON.parse(JSON.stringify(newPayload)) : undefined,
      },
    });
  } catch (error) {
    // Log error internally without blocking the primary business transaction
    console.error('Audit Trail Persistence Error:', error);
  }
}
