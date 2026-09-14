"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

// Service Items
export async function getServiceItems() {
  try {
    const services = await prisma.serviceItem.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    return services;
  } catch (error) {
    console.error("Error fetching service items:", error);
    return [];
  }
}

export async function createServiceItem(data: { name: string, category: string, govFee: number, agencyFee: number, isVatExempt: boolean, isActive?: boolean }) {
  try {
    const service = await prisma.serviceItem.create({ data });
    revalidatePath("/settings");
    return { success: true, service };
  } catch (error: any) {
    console.error("Error creating service item:", error);
    return { success: false, error: error.message };
  }
}

export async function updateServiceItem(id: string, data: Partial<{ name: string, category: string, govFee: number, agencyFee: number, isVatExempt: boolean, isActive: boolean }>) {
  try {
    const service = await prisma.serviceItem.update({
      where: { id },
      data
    });
    revalidatePath("/settings");
    return { success: true, service };
  } catch (error: any) {
    console.error("Error updating service item:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteServiceItem(id: string) {
  try {
    await prisma.serviceItem.delete({ where: { id } });
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting service item:", error);
    return { success: false, error: error.message };
  }
}

// Company Settings
export async function getCompanySettings() {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: "DEFAULT" }
    });
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: "DEFAULT" }
      });
    }
    return settings;
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return {
      id: "DEFAULT",
      companyNameEn: "Zyra Clearance Services",
      companyNameAr: "",
      trn: "",
      tradeLicenseNo: "",
      address: "",
      bankName: "",
      accountName: "",
      iban: "",
      swift: "",
      invoiceNotes: "",
      financePin: "1234"
    };
  }
}

export async function updateCompanySettings(data: Partial<{ companyNameEn: string, companyNameAr: string, trn: string, tradeLicenseNo: string, address: string, bankName: string, accountName: string, iban: string, swift: string, invoiceNotes: string }>) {
  try {
    const settings = await prisma.companySettings.upsert({
      where: { id: "DEFAULT" },
      update: data,
      create: { id: "DEFAULT", ...data }
    });
    revalidatePath("/settings");
    return { success: true, settings };
  } catch (error: any) {
    console.error("Error updating company settings:", error);
    return { success: false, error: error.message };
  }
}

// Security & PIN
export async function updateFinancePin(currentPin: string, newPin: string) {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: "DEFAULT" } });
    const actualPin = settings?.financePin || "1234"; // Default is 1234 if not set

    if (currentPin !== actualPin) {
      return { success: false, error: "Current PIN is incorrect." };
    }

    await prisma.companySettings.upsert({
      where: { id: "DEFAULT" },
      update: { financePin: newPin },
      create: { id: "DEFAULT", financePin: newPin }
    });
    
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating finance PIN:", error);
    return { success: false, error: error.message };
  }
}

export async function verifyFinancePin(pin: string) {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: "DEFAULT" } });
    const actualPin = settings?.financePin || "1234";
    return actualPin === pin;
  } catch (error) {
    console.error("Error verifying finance PIN:", error);
    return false;
  }
}

// Team Users
export async function getTeamUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching team users:", error);
    return [];
  }
}

export async function createTeamUser(data: { name: string, email: string, role: Role, password?: string }) {
  try {
    const user = await prisma.user.create({ data });
    revalidatePath("/settings");
    return { success: true, user };
  } catch (error: any) {
    console.error("Error creating team user:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(id: string, role: Role, isActive?: boolean) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { 
        role,
        ...(isActive !== undefined && { isActive })
      }
    });
    revalidatePath("/settings");
    return { success: true, user };
  } catch (error: any) {
    console.error("Error updating team user:", error);
    return { success: false, error: error.message };
  }
}
