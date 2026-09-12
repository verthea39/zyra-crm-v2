import { inngest } from "./client";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/services/whatsapp.service";

export const dispatchInvoiceWhatsApp = inngest.createFunction(
  { 
    id: "dispatch-invoice-whatsapp",
    concurrency: 2,
    retries: 3,
    triggers: [{ event: "invoice/dispatch.whatsapp" }],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data;

    // 1. Fetch Invoice Details
    const invoice = await step.run("fetch-invoice", async () => {
      const inv = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: {
            include: {
              corporateProfile: true,
              individualProfile: true,
            }
          }
        }
      });
      if (!inv) throw new Error(`Invoice ${invoiceId} not found`);
      return inv;
    });

    // 2. Extract Phone Number
    const phone = await step.run("extract-phone", () => {
      let num = null;
      if (invoice.client.clientType === "CORPORATE") {
        num = invoice.client.corporateProfile?.authorizedSignatoryMobile;
      } else {
        num = invoice.client.individualProfile?.mobileNumber;
      }
      return num;
    });

    if (!phone) {
      return { skipped: true, reason: "No mobile number available for client" };
    }

    // 3. Format Message
    const message = await step.run("format-message", () => {
      const amount = (Number(invoice.totalPayableMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 });
      const publicPdfUrl = invoice.govReceiptUrl || `https://zyracrm.com/invoices/${invoice.id}/pdf`;
      return `Hello from Zyra Documents Clearance!\n\nYour invoice ${invoice.invoiceNumber} for AED ${amount} has been generated.\n\nYou can view and download it here: ${publicPdfUrl}\n\nThank you for choosing Zyra!`;
    });

    // 4. Send via WhatsApp Service
    await step.run("send-whatsapp", async () => {
      await sendWhatsAppMessage(phone, message);
    });

    return { success: true, dispatchedTo: phone };
  }
);

export const complianceReminders = inngest.createFunction(
  {
    id: "compliance-reminders",
    // Run every day at 9 AM UAE time (approx 5 AM UTC)
    triggers: [{ cron: "0 5 * * *" }],
  },
  async ({ step }) => {
    // 30 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 1. Check Trade Licenses
    const expiringLicenses = await step.run("check-trade-licenses", async () => {
      return await db.corporateProfile.findMany({
        where: {
          tradeLicenseExpiry: { gte: startOfDay, lte: endOfDay },
          authorizedSignatoryMobile: { not: null }
        },
        select: { companyNameEn: true, tradeLicenseExpiry: true, authorizedSignatoryMobile: true }
      });
    });

    // 2. Check Passports
    const expiringPassports = await step.run("check-passports", async () => {
      return await db.individualProfile.findMany({
        where: {
          passportExpiry: { gte: startOfDay, lte: endOfDay },
          mobileNumber: { not: null }
        },
        select: { fullNameEn: true, passportExpiry: true, mobileNumber: true }
      });
    });

    // 3. Dispatch License Reminders
    for (const corp of expiringLicenses) {
      await step.run(`notify-license-${corp.companyNameEn}`, async () => {
        if (corp.authorizedSignatoryMobile) {
          const msg = `Reminder from Zyra: The Trade License for ${corp.companyNameEn} expires in 30 days. Please contact us to begin the renewal process.`;
          await sendWhatsAppMessage(corp.authorizedSignatoryMobile, msg);
        }
      });
    }

    // 4. Dispatch Passport Reminders
    for (const ind of expiringPassports) {
      await step.run(`notify-passport-${ind.fullNameEn}`, async () => {
        if (ind.mobileNumber) {
          const msg = `Reminder from Zyra: Dear ${ind.fullNameEn}, your passport expires in 30 days. Please ensure it is renewed to avoid compliance issues.`;
          await sendWhatsAppMessage(ind.mobileNumber, msg);
        }
      });
    }

    return {
      success: true,
      licensesNotified: expiringLicenses.length,
      passportsNotified: expiringPassports.length,
    };
  }
);
