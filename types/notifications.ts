export type NotificationChannel = 'WHATSAPP' | 'EMAIL';

export interface NotificationPayload {
  transactionId: string;
  recipientName: string;
  recipientContact: string; // Phone with country code or email
  amountDue: number;
  currency: string;
  dueDate: string;
  referenceId: string;
  channel: NotificationChannel;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
