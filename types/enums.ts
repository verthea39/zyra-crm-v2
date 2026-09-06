export enum RoleName {
  SUPER_ADMIN = "SUPER_ADMIN",
  OPERATIONS_MANAGER = "OPERATIONS_MANAGER",
  PRO_AGENT = "PRO_AGENT",
  CLIENT_PORTAL = "CLIENT_PORTAL",
}

export enum ClientType {
  CORPORATE = "CORPORATE",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum AccountStatus {
  PROSPECT = "PROSPECT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum StepStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskVenue {
  DUBAI = "DUBAI",
  ABU_DHABI = "ABU_DHABI",
  SHARJAH = "SHARJAH",
  OTHER = "OTHER",
}

export enum DocumentCategory {
  PASSPORT = "PASSPORT",
  EMIRATES_ID = "EMIRATES_ID",
  TRADE_LICENSE = "TRADE_LICENSE",
  OTHER = "OTHER",
}

export enum DocumentVerificationStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum LineItemType {
  GOVERNMENT_CHARGE = "GOVERNMENT_CHARGE",
  AGENCY_SERVICE_FEE = "AGENCY_SERVICE_FEE",
}

export enum IssuingAuthority {
  DED = "DED",
  FREEZONE = "FREEZONE",
}

export enum LeadSource {
  WEBSITE = "WEBSITE",
  REFERRAL = "REFERRAL",
  OTHER = "OTHER",
}

export enum LegalType {
  LLC = "LLC",
  ESTABLISHMENT = "ESTABLISHMENT",
}

export enum LicenseType {
  COMMERCIAL = "COMMERCIAL",
  PROFESSIONAL = "PROFESSIONAL",
}

export enum VisaType {
  EMPLOYMENT = "EMPLOYMENT",
  INVESTOR = "INVESTOR",
}
