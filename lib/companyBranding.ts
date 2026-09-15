import prisma from "@/lib/prisma";
import { ZYRA_LOGO_GOLD_DATA_URI } from "@/lib/brandAssets";

export type CompanyBranding = {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website: string;
  portalUrl: string;
  trn?: string | null;
  tradeLicenseNo?: string | null;
  logoUrl?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  iban?: string | null;
  swift?: string | null;
  paymentTerms?: string | null;
};

const DEFAULT_BRANDING: CompanyBranding = {
  name: "Zyra Business Hub",
  address: "Deira / Burj Nahar, Dubai, UAE",
  phone: null,
  email: null,
  website: "zyrabusinesshub.com",
  portalUrl: "crm.zyrabusinesshub.com",
  trn: null,
  tradeLicenseNo: null,
  logoUrl: ZYRA_LOGO_GOLD_DATA_URI,
  bankName: null,
  accountName: null,
  iban: null,
  swift: null,
  paymentTerms: null,
};

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

/** Client-side-safe fallback for callers that can't hit Prisma directly (e.g. lib/printUtils.ts). */
export function getDefaultCompanyBranding(): CompanyBranding {
  return DEFAULT_BRANDING;
}

/** Inline SVG logo -- used whenever no logoUrl is configured. Safe for print/PDF (no external request, no CORS). */
export function companyLogoSvg(initials = "ZBH", size = 36): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="44" rx="10" fill="#FDF8F0" stroke="#EADBC8"/>
      <text x="22" y="28" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#98682E" text-anchor="middle">${initials}</text>
    </svg>
  `;
}
