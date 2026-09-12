import { z } from 'zod';

export const transactionInputSchema = z.object({
  refId: z
    .string()
    .min(3, 'Reference ID must be at least 3 characters')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Reference ID must use uppercase letters, numbers, and dashes'),
  type: z.enum(['INCOME', 'EXPENSE']),
  counterpartyName: z.string().min(2, 'Counterparty name is required').max(255),
  category: z.string().min(2, 'Category is required').max(100),
  totalAmount: z
    .number({ invalid_type_error: 'Total amount must be a valid number' })
    .positive('Total amount must be greater than zero')
    .max(1000000000, 'Amount exceeds permitted ceiling'),
  paidAmount: z
    .number({ invalid_type_error: 'Paid amount must be a valid number' })
    .nonnegative('Paid amount cannot be negative'),
  dueDate: z.string().optional().nullable(),
}).refine((data) => data.paidAmount <= data.totalAmount, {
  message: 'Paid amount cannot exceed total billed amount',
  path: ['paidAmount'],
});

export type ValidatedTransactionInput = z.infer<typeof transactionInputSchema>;
