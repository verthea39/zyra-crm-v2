"use server";

import { getCompanyBranding, type CompanyBranding } from "@/lib/companyBranding";

export async function getBranding(): Promise<CompanyBranding> {
  return getCompanyBranding();
}
