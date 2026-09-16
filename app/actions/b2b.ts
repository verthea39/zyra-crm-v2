"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { logServerError } from "@/lib/logger";

export async function getCorporateClients() {
  try {
    const corporates = await prisma.client.findMany({
      where: {
        type: "CORPORATE"
      },
      include: {
        employees: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    return corporates;
  } catch (error) {
    logServerError(error, { action: "getCorporateClients" });
    return [];
  }
}

export async function getCompanyProfile(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        employees: { orderBy: { createdAt: "desc" } },
        vaultDocuments: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch (error) {
    logServerError(error, { action: "getCompanyProfile" });
    return null;
  }
}

export type CreateCompanyInput = {
  name: string;
  tradeLicenseNo?: string;
  trnNumber?: string;
  establishmentCardNo?: string;
  mohreQuotaTotal?: number;
  email?: string;
  phone?: string;
};

export async function createCompany(input: CreateCompanyInput) {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "Company name is required" };
    }

    const company = await prisma.client.create({
      data: {
        type: "CORPORATE",
        name: input.name.trim(),
        tradeLicenseNo: input.tradeLicenseNo || undefined,
        trnNumber: input.trnNumber || undefined,
        establishmentCardNo: input.establishmentCardNo || undefined,
        mohreQuotaTotal: input.mohreQuotaTotal ?? 20,
        email: input.email || undefined,
        phone: input.phone || undefined,
      },
    });

    revalidatePath("/b2b-registry");

    await logActivity({
      action: "COMPANY_ADDED",
      title: `Company "${company.name}" added to B2B Registry`,
      details: { companyId: company.id },
      entityType: "CLIENT",
      entityId: company.id,
    });

    return { success: true, company };
  } catch (error) {
    logServerError(error, { action: "createCompany" });
    return { success: false, error: "Failed to create company" };
  }
}

export type UpdateCompanyInput = {
  name: string;
  trnNumber?: string;
  tradeLicenseNo?: string;
  expiryDate?: string; // trade license expiry
  mohreQuotaTotal?: number;
  email?: string;
  phone?: string;
};

export async function updateCompany(id: string, input: UpdateCompanyInput) {
  try {
    const company = await prisma.client.update({
      where: { id },
      data: {
        name: input.name,
        trnNumber: input.trnNumber || undefined,
        tradeLicenseNo: input.tradeLicenseNo || undefined,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        mohreQuotaTotal: input.mohreQuotaTotal,
        email: input.email || undefined,
        phone: input.phone || undefined,
      },
    });

    revalidatePath("/b2b-registry");

    await logActivity({
      action: "COMPANY_UPDATED",
      title: `Company "${company.name}" details updated`,
      details: { companyId: company.id },
      entityType: "CLIENT",
      entityId: company.id,
    });

    return { success: true, company };
  } catch (error) {
    logServerError(error, { action: "updateCompany" });
    return { success: false, error: "Failed to update company" };
  }
}

export type CreateEmployeeInput = {
  corporateId: string;
  name: string;
  designation?: string;
  passportNo?: string;
  emiratesIdNo?: string;
  visaCategory?: string;
  visaStatus?: string;
  expiryDate?: string;
};

export async function createEmployee(input: CreateEmployeeInput) {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "Employee name is required" };
    }

    const employee = await prisma.employee.create({
      data: {
        corporateId: input.corporateId,
        name: input.name.trim(),
        designation: input.designation || undefined,
        passportNo: input.passportNo || undefined,
        emiratesIdNo: input.emiratesIdNo || undefined,
        visaCategory: input.visaCategory || undefined,
        visaStatus: input.visaStatus || "ACTIVE",
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      },
    });

    revalidatePath("/b2b-registry");
    return { success: true, employee };
  } catch (error) {
    logServerError(error, { action: "createEmployee" });
    return { success: false, error: "Failed to add employee" };
  }
}
