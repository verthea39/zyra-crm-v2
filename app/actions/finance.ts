"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createIncome(data: any) {
  try {
    const govFee = Math.round(data.govFees * 100);
    const serviceFee = Math.round(data.serviceFee * 100);
    const amountTotal = govFee + serviceFee;
    const amountPaid = Math.round(data.amountPaid * 100);
    const balance = amountTotal - amountPaid;
    
    let status = "PENDING";
    if (balance <= 0) status = "PAID";
    else if (data.dueDate && new Date(data.dueDate) < new Date()) status = "OVERDUE";

    // Auto-generate reference INV-{Year}-{Random or Sequence}
    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({ where: { type: 'INCOME' }});
    const reference = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    // Link to client if a match is found
    const client = await prisma.client.findFirst({
      where: { name: { equals: data.clientName, mode: 'insensitive' } }
    });

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type: "INCOME",
        counterparty: data.clientName,
        category: data.category,
        paymentMode: data.paymentMode,
        amountTotal,
        amountPaid,
        status: status as any,
        date: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description,
        isCaseInvoice: true, // As per rule, we assume this adds to dual-bucket
        govFeePart: govFee,
        serviceFeePart: serviceFee,
        clientId: client?.id,
      }
    });

    revalidatePath("/finance/cockpit");
    return { success: true, tx };
  } catch (error) {
    console.error("Error creating income:", error);
    return { success: false, error: "Failed to create income transaction." };
  }
}

export async function createInvoice(data: any) {
  try {
    const govFee = Math.round(data.govCost * 100);
    const serviceFee = Math.round(data.proFee * 100);
    const vatAmount = Math.round(data.vatAmount * 100);
    const amountTotal = govFee + serviceFee + vatAmount;
    const amountPaid = 0; // Invoices are generated unpaid initially
    
    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({ where: { type: 'INCOME' }});
    const reference = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type: "INCOME",
        counterparty: data.clientName,
        category: "Invoice Generation",
        paymentMode: "Pending",
        amountTotal,
        amountPaid,
        status: "PENDING",
        date: new Date(),
        description: data.caseRef ? `Case Ref: ${data.caseRef}` : 'Auto-generated invoice',
        isCaseInvoice: true,
        govFeePart: govFee,
        serviceFeePart: serviceFee,
        clientId: data.clientId || null,
        lineItems: data.lineItems
      }
    });

    revalidatePath("/finance/cockpit");
    return { success: true, tx, reference };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, error: "Failed to create invoice." };
  }
}

export async function createExpense(data: any) {
  try {
    const amountTotal = Math.round(data.amount * 100);
    const amountPaid = Math.round(data.amountPaid * 100);
    const balance = amountTotal - amountPaid;
    
    let status = "PENDING";
    if (balance <= 0) status = "PAID";
    else if (data.dueDate && new Date(data.dueDate) < new Date()) status = "OVERDUE";

    // Auto-generate reference EXP-{Year}-{Random or Sequence}
    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({ where: { type: 'EXPENSE' }});
    const reference = `EXP-${year}-${String(count + 1).padStart(3, '0')}`;

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type: "EXPENSE",
        counterparty: data.vendor,
        category: data.category,
        paymentMode: data.paymentMode,
        amountTotal,
        amountPaid,
        status: status as any,
        date: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description,
      }
    });

    revalidatePath("/finance/cockpit");
    return { success: true, tx };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense transaction." };
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/finance/cockpit");
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: "Failed to delete transaction." };
  }
}

export async function getPendingInvoices(clientId: string) {
  try {
    const invoices = await prisma.transaction.findMany({
      where: {
        clientId,
        type: "INCOME",
        status: { in: ["PENDING", "OVERDUE"] },
      },
      select: {
        id: true,
        reference: true,
        amountTotal: true,
        amountPaid: true,
      },
      orderBy: { date: "desc" },
    });
    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}
