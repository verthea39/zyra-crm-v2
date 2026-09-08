import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { db } from "@/lib/db";
import { serialize } from "./finance.service";

export async function generateExport(filters: any, userId: string) {
  const workbook = new ExcelJS.Workbook();

  // 2. Fetch data
  const transactions = await db.transaction.findMany({
    where: { deletedAt: null },
    include: { client: { include: { corporateProfile: true, individualProfile: true } }, category: true, caseFile: true },
    orderBy: { occurredAt: "desc" }
  });

  const clients = await db.client.findMany({
    include: { corporateProfile: true, individualProfile: true }
  });

  const cases = await db.caseFile.findMany({
    include: { client: { include: { corporateProfile: true, individualProfile: true } } }
  });

  const payments = await db.payment.findMany({
    where: { deletedAt: null },
    include: { account: true, client: { include: { corporateProfile: true, individualProfile: true } } }
  });

  const receivables = await db.$queryRaw`
    SELECT 
      r.*, 
      COALESCE(cp."companyNameEn", ip."fullNameEn", 'Unknown Client') as name
    FROM "receivables_ageing" r
    JOIN "Client" c ON r."clientId" = c.id
    LEFT JOIN "CorporateProfile" cp ON cp."clientId" = c.id
    LEFT JOIN "IndividualProfile" ip ON ip."clientId" = c.id
  `;

  // 3. Populate Sheets
  const wsTransactions = workbook.addWorksheet("Transactions");
  const transactionRows = transactions.map(t => {
    const clientName = t.client?.clientType === "CORPORATE" 
      ? t.client.corporateProfile?.companyNameEn 
      : t.client?.individualProfile?.fullNameEn;
    return [
      t.reference,
      t.occurredAt,
      t.direction,
      t.category.name,
      clientName || "N/A",
      t.caseFile?.code || "N/A",
      Number(t.amountFils) / 100,
      Number(t.taxFils) / 100,
      Number(t.settledFils) / 100,
      Number(t.amountFils + t.taxFils - t.settledFils) / 100,
      t.status,
      t.description || ""
    ];
  });
  
  if (transactionRows.length > 0) {
    wsTransactions.addTable({
      name: 'TransactionsTable',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: "Reference", filterButton: true },
        { name: "Date", filterButton: true },
        { name: "Direction", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Client", filterButton: true },
        { name: "Case", filterButton: true },
        { name: "Amount", filterButton: true },
        { name: "Tax", filterButton: true },
        { name: "Settled", filterButton: true },
        { name: "Balance", filterButton: true },
        { name: "Status", filterButton: true },
        { name: "Description", filterButton: true }
      ],
      rows: transactionRows
    });
  } else {
    wsTransactions.addRow(["No Transactions"]);
  }

  const wsClients = workbook.addWorksheet("Clients");
  const clientRows = clients.map(c => {
    const name = c.clientType === "CORPORATE" 
      ? c.corporateProfile?.companyNameEn 
      : c.individualProfile?.fullNameEn;
    return [
      c.code || c.id,
      name || "Unknown",
      c.clientType,
      c.accountStatus,
      0, 0, 0
    ];
  });

  if (clientRows.length > 0) {
    wsClients.addTable({
      name: 'ClientsTable',
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: "Code", filterButton: true },
        { name: "Name", filterButton: true },
        { name: "Type", filterButton: true },
        { name: "Status", filterButton: true },
        { name: "Billed", filterButton: true },
        { name: "Collected", filterButton: true },
        { name: "Due", filterButton: true }
      ],
      rows: clientRows
    });
  } else {
    wsClients.addRow(["No Clients"]);
  }

  const wsCases = workbook.addWorksheet("Cases");
  const caseRows = cases.map(c => {
    const clientName = c.client?.clientType === "CORPORATE" 
      ? c.client.corporateProfile?.companyNameEn 
      : c.client?.individualProfile?.fullNameEn;
    return [
      c.code,
      clientName || "Unknown",
      c.serviceType,
      c.status,
      c.openedAt,
      c.closedAt || "",
      0, 0, 0
    ];
  });

  if (caseRows.length > 0) {
    wsCases.addTable({
      name: 'CasesTable',
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: "Code", filterButton: true },
        { name: "Client", filterButton: true },
        { name: "Service", filterButton: true },
        { name: "Status", filterButton: true },
        { name: "Opened At", filterButton: true },
        { name: "Closed At", filterButton: true },
        { name: "Total Cost", filterButton: true },
        { name: "Total Billed", filterButton: true },
        { name: "Margin", filterButton: true }
      ],
      rows: caseRows
    });
  } else {
    wsCases.addRow(["No Cases"]);
  }

  const wsPayments = workbook.addWorksheet("Payments");
  const paymentRows = payments.map(p => {
    const clientName = p.client?.clientType === "CORPORATE" 
      ? p.client.corporateProfile?.companyNameEn 
      : p.client?.individualProfile?.fullNameEn;
    return [
      p.reference,
      p.occurredAt,
      p.direction,
      p.mode,
      p.account.name,
      clientName || "N/A",
      Number(p.amountFils) / 100,
      Number(p.amountFils - p.unappliedFils) / 100,
      Number(p.unappliedFils) / 100,
      p.chequeNo || "",
      p.notes || ""
    ];
  });

  if (paymentRows.length > 0) {
    wsPayments.addTable({
      name: 'PaymentsTable',
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: "Reference", filterButton: true },
        { name: "Date", filterButton: true },
        { name: "Direction", filterButton: true },
        { name: "Mode", filterButton: true },
        { name: "Account", filterButton: true },
        { name: "Client", filterButton: true },
        { name: "Amount", filterButton: true },
        { name: "Applied", filterButton: true },
        { name: "Unapplied", filterButton: true },
        { name: "Cheque No", filterButton: true },
        { name: "Notes", filterButton: true }
      ],
      rows: paymentRows
    });
  } else {
    wsPayments.addRow(["No Payments"]);
  }

  const wsReceivables = workbook.addWorksheet("Receivables");
  const receivableRows = (receivables as any[]).map(r => {
    const total = Number(r.bucket_0_30) + Number(r.bucket_31_60) + Number(r.bucket_61_90) + Number(r.bucket_90_plus);
    return [
      r.name,
      Number(r.bucket_0_30) / 100,
      Number(r.bucket_31_60) / 100,
      Number(r.bucket_61_90) / 100,
      Number(r.bucket_90_plus) / 100,
      total / 100
    ];
  });

  if (receivableRows.length > 0) {
    wsReceivables.addTable({
      name: 'ReceivablesTable',
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: "Client Name", filterButton: true },
        { name: "0-30 Days", filterButton: true },
        { name: "31-60 Days", filterButton: true },
        { name: "61-90 Days", filterButton: true },
        { name: "90+ Days", filterButton: true },
        { name: "Total", filterButton: true }
      ],
      rows: receivableRows
    });
  } else {
    wsReceivables.addRow(["No Receivables"]);
  }

  // 4. About Sheet
  const wsAbout = workbook.addWorksheet("About");
  if (wsAbout) {
    const nowDubai = new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" });
    wsAbout.getCell("A1").value = "Zyra CRM Export";
    wsAbout.getCell("A2").value = `Generated at: ${nowDubai} (Asia/Dubai)`;
    wsAbout.getCell("A3").value = `Generated by: User ID ${userId}`;
    wsAbout.getCell("A4").value = `Filters: ${JSON.stringify(filters)}`;
    wsAbout.getCell("A5").value = "Note: This file is a point-in-time snapshot of the database.";
    wsAbout.getCell("A6").value = `Row Counts: Transactions (${transactions.length}), Clients (${clients.length}), Cases (${cases.length}), Payments (${payments.length})`;
  }

  // Audit log
  await db.auditLog.create({
    data: {
      entity: "Export",
      entityId: "EXCEL",
      action: "GENERATE",
      reason: "User requested full Excel export",
      userId,
    }
  });

  // 5. Generate Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
