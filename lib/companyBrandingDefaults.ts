import { ZYRA_LOGO_GOLD_DATA_URI } from "@/lib/brandAssets";
import { COMPANY_PROFILE } from "@/lib/constants/company";

/**
 * Client-safe branding defaults/types -- no Prisma import here. This file
 * exists specifically so client components can pull print/branding helpers
 * (via lib/printUtils.ts) without dragging the Prisma runtime into the
 * browser bundle. companyBranding.ts re-exports everything here plus its
 * own server-only getCompanyBranding(); only that server-only piece touches
 * Prisma.
 */
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

export const DEFAULT_BRANDING: CompanyBranding = {
  name: COMPANY_PROFILE.displayName,
  address: COMPANY_PROFILE.address,
  phone: COMPANY_PROFILE.phones.join(" / "),
  email: COMPANY_PROFILE.email,
  website: COMPANY_PROFILE.website,
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
