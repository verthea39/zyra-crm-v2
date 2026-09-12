import { inngest } from "./client";
import { db } from "@/lib/db";
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument';
import { format } from 'date-fns';
import { LOGO_BASE64 } from '@/lib/pdf/logoBase64';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import React from 'react';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_ENDPOINT, 
  forcePathStyle: true,
});
const bucketName = process.env.AWS_BUCKET_NAME || 'invoices';

export const generateInvoicePdf = inngest.createFunction(
  { 
    id: "generate-invoice-pdf",
    concurrency: 3,
    retries: 2,
    triggers: [{ event: "invoice/generate.pdf" }],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data;

    // Step 1: Query relational data
    const txn = await step.run("fetch-invoice-data", async () => {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          lineItems: true,
          client: {
            include: {
              corporateProfile: true,
              individualProfile: true,
            }
          }
        }
      });
      if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
      return invoice;
    });

    // Step 2: Render PDF to Base64 (needed for cross-step JSON serialization)
    const base64Pdf = await step.run("render-pdf-buffer", async () => {
      const isCorp = txn.client?.clientType === "CORPORATE";
      const clientName = isCorp 
        ? txn.client?.corporateProfile?.companyNameEn 
        : txn.client?.individualProfile?.fullNameEn;
      const clientTrn = isCorp ? txn.client?.corporateProfile?.vatTrn : null;
      const clientPhone = isCorp 
        ? txn.client?.corporateProfile?.authorizedSignatoryMobile 
        : txn.client?.individualProfile?.passportNumber;

      const amountStr = (Number(txn.subtotalServiceFeesMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const taxStr = (Number(txn.vatAmountMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const settledStr = (Number(txn.paidAmountMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const billedStr = (Number(txn.totalPayableMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const balanceStr = (Number(txn.balanceDueMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const govStr = (Number(txn.subtotalGovDisbursementsMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const lineItems = txn.lineItems.map((li: any) => ({
        description: li.description,
        type: li.type,
        quantity: li.quantity.toString(),
        unitPrice: (Number(li.unitPriceMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vatRate: li.vatRate.toString(),
        lineTotal: (Number(li.unitPriceMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      }));

      const element = React.createElement(InvoiceDocument, {
        logoUrl: LOGO_BASE64,
        invoiceNumber: txn.invoiceNumber,
        issueDate: format(new Date(txn.issueDate), "dd MMM yyyy"),
        supplyDate: format(new Date(txn.supplyDate), "dd MMM yyyy"),
        currency: txn.currency,
        supplierName: "Zyra Documents Clearance Services",
        supplierAddress: "Burj Nahar Mall - Al Muteena, Deira, Dubai",
        supplierPhone: "+971 4 123 4567",
        supplierEmail: "info@zyradocs.com",
        supplierWeb: "www.zyradocs.com",
        supplierTrn: txn.supplierTrn,
        customerName: clientName || "Cash Customer",
        customerTrn: txn.customerTrn || clientTrn || null,
        customerContact: clientPhone || undefined,
        lineItems: lineItems,
        subtotalServiceFees: amountStr,
        vatAmount: taxStr,
        subtotalGovDisbursements: govStr,
        totalPayable: billedStr,
        paidAmount: settledStr,
        balanceDue: balanceStr,
        qrDataUrl: "",
      });

      const buffer = await renderToBuffer(element as any);
      return buffer.toString('base64');
    });

    // Step 3: Upload to S3 / Supabase Storage
    const publicUrl = await step.run("upload-to-storage", async () => {
      const buffer = Buffer.from(base64Pdf, 'base64');
      const fileName = `invoices/${txn.invoiceNumber || txn.id}-${Date.now()}.pdf`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: 'application/pdf',
      });
      await s3Client.send(command);

      const publicDomain = process.env.AWS_PUBLIC_DOMAIN || `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
      return `${publicDomain}/${fileName}`;
    });

    // Step 4: Persist URL to database
    await step.run("update-database-record", async () => {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { govReceiptUrl: publicUrl }
      });
    });

    return { success: true, url: publicUrl };
  }
);
