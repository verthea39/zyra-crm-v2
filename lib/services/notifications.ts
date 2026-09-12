import { Resend } from 'resend';
import twilio from 'twilio';
import { NotificationPayload, NotificationResult } from '@/types/notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendPaymentReminder(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const formatAED = (amt: number) =>
    `AED ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  try {
    if (payload.channel === 'WHATSAPP') {
      // UAE-compliant formatted WhatsApp corporate message
      const message = await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, // e.g. whatsapp:+14155238886
        to: `whatsapp:${payload.recipientContact}`,
        body:
          `*Executive Finance Notice*\n\n` +
          `Dear ${payload.recipientName},\n\n` +
          `This is an automated statement regarding Tax Invoice *${payload.referenceId}*.\n` +
          `Outstanding Balance: *${formatAED(payload.amountDue)}*\n` +
          `Due Date: *${payload.dueDate}*\n\n` +
          `Please settle via corporate bank transfer. Reply to this message for any balance inquiries.`,
      });

      return { success: true, messageId: message.sid };
    }

    if (payload.channel === 'EMAIL') {
      const emailResponse = await resend.emails.send({
        from: 'Finance Treasury <finance@yourdomain.ae>',
        to: payload.recipientContact,
        subject: `Statement Notice: Invoice ${payload.referenceId} Due (${formatAED(payload.amountDue)})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <div style="background-color: #0B132B; padding: 12px 18px; border-radius: 8px; color: #FFFFFF; font-weight: bold; font-size: 14px;">
              EXECUTIVE FINANCE COCKPIT &bull; DUBAI CORPORATE
            </div>
            <h2 style="color: #0F172A; margin-top: 20px;">Payment Statement & Notice</h2>
            <p style="color: #475569; font-size: 14px;">Dear ${payload.recipientName},</p>
            <p style="color: #475569; font-size: 14px;">
              We would like to remind you of the outstanding balance for invoice <strong>${payload.referenceId}</strong>.
            </p>
            <div style="background-color: #F8FAFC; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 13px; color: #64748B;">Total Due: <strong style="color: #D97706; font-size: 16px;">${formatAED(payload.amountDue)}</strong></p>
              <p style="margin: 4px 0; font-size: 13px; color: #64748B;">Maturity / Due Date: <strong>${payload.dueDate}</strong></p>
            </div>
            <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              Treasury Department &bull; Regulated under UAE Corporate Tax & VAT Guidelines.
            </p>
          </div>
        `,
      });

      return { success: true, messageId: emailResponse.data?.id };
    }

    return { success: false, error: 'Unsupported notification channel' };
  } catch (error: any) {
    console.error('Notification dispatch failure:', error);
    return { success: false, error: error.message || 'Dispatch failed' };
  }
}
