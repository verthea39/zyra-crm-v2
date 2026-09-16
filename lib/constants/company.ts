/**
 * Canonical Zyra Documents Clearance Services company profile. This is the
 * single source of truth for legal name, contact details, and the service
 * catalog structure -- invoice headers, PDFs, and the public tracking page
 * should all read from here (or from CompanySettings in the DB, which is
 * seeded from these values; see lib/companyBranding.ts).
 */

export const COMPANY_PROFILE = {
  legalName: "ZYRA DOCUMENTS CLEARANCE SERVICES",
  displayName: "Zyra Documents Clearance Services",
  address: "C2-01, M2 Floor, Burj Nahar Complex, Al Muteena, Deira, Dubai, UAE",
  phones: ["+971 54 782 4637", "+971 50 722 8583"],
  email: "zyrabusinesshub@gmail.com",
  website: "zyrabusinesshub.com",
} as const;

export type ServiceVerticalKey =
  | "UAE_VISA_EID"
  | "IMMIGRATION_GDRFA"
  | "MOHRE_LABOUR"
  | "TRADE_LICENSE_FORMATION"
  | "MEDICAL_TYPING";

export const SERVICE_VERTICALS: Record<ServiceVerticalKey, { label: string; services: string[] }> = {
  UAE_VISA_EID: {
    label: "UAE Visa & Emirates ID",
    services: ["New Visa", "Visa Renewal", "Visa Cancellation", "Dependent Visa", "Emirates ID Replacement"],
  },
  IMMIGRATION_GDRFA: {
    label: "Immigration & GDRFA",
    services: ["Entry Permit", "Status Change", "Establishment Card", "Tourist Visa"],
  },
  MOHRE_LABOUR: {
    label: "MOHRE & Labour",
    services: ["Quota Approval", "Work Permit", "Offer Letter", "Labour Payment"],
  },
  TRADE_LICENSE_FORMATION: {
    label: "Trade License & Formation",
    services: ["Mainland Setup", "Freezone Setup", "License Renewal", "Activity Amendment"],
  },
  MEDICAL_TYPING: {
    label: "Medical Typing & Follow-up",
    services: ["DHA Medical Typing", "EHS Medical Typing", "Medical Appointment Follow-up"],
  },
};

export const SERVICE_CATEGORY_LABELS = Object.values(SERVICE_VERTICALS).map((v) => v.label);
