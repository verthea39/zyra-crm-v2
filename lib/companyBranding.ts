import prisma from "@/lib/prisma";
import { DEFAULT_BRANDING, type CompanyBranding } from "@/lib/companyBrandingDefaults";

export type { CompanyBranding };
export { DEFAULT_BRANDING, getDefaultCompanyBranding, companyLogoSvg } from "@/lib/companyBrandingDefaults";

/** Server-side: reads CompanySettings and fills gaps with sensible defaults. */
export async function getCompanyBranding(): Promise<CompanyBranding> {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: "DEFAULT" } });
    if (!settings) return DEFAULT_BRANDING;

    return {
      name: settings.companyNameEn || DEFAULT_BRANDING.name,
      address: settings.address || DEFAULT_BRANDING.address,
      phone: settings.phone || DEFAULT_BRANDING.phone,
      email: settings.email || DEFAULT_BRANDING.email,
      website: settings.website || DEFAULT_BRANDING.website,
      portalUrl: DEFAULT_BRANDING.portalUrl,
      trn: settings.trn || DEFAULT_BRANDING.trn,
      tradeLicenseNo: settings.tradeLicenseNo || DEFAULT_BRANDING.tradeLicenseNo,
      logoUrl: settings.logoUrl || DEFAULT_BRANDING.logoUrl,
      bankName: settings.bankName || DEFAULT_BRANDING.bankName,
      accountName: settings.accountName || DEFAULT_BRANDING.accountName,
      iban: settings.iban || DEFAULT_BRANDING.iban,
      swift: settings.swift || DEFAULT_BRANDING.swift,
      paymentTerms: settings.paymentTerms || DEFAULT_BRANDING.paymentTerms,
    };
  } catch (err) {
    console.error("Failed to load company branding, using defaults:", err);
    return DEFAULT_BRANDING;
  }
}
