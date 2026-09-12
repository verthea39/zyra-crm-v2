"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
type AccountStatus = "ACTIVE" | "PROSPECT" | "INACTIVE" | "ARCHIVED";
type ClientType = "CORPORATE" | "INDIVIDUAL";

const corporateSchema = z.object({
  clientType: z.literal("CORPORATE"),
  leadSource: z.string(),
  companyNameEn: z.string().min(2),
  companyNameAr: z.string().optional(),
  tradeLicenseNumber: z.string().min(3),
  licenseType: z.string().optional(),
  issuingAuthority: z.string(),
  legalType: z.string().optional(),
  tradeLicenseExpiry: z.string().optional(),
  vatTrn: z.string().optional(),
  corporateTaxTrn: z.string().optional(),
  ejariNumber: z.string().optional(),
});

const individualSchema = z.object({
  clientType: z.literal("INDIVIDUAL"),
  leadSource: z.string(),
  fullNameEn: z.string().min(2),
  fullNameAr: z.string().optional(),
  passportNumber: z.string().min(3),
  nationality: z.string().min(2),
  passportExpiry: z.string().optional(),
  emiratesIdNumber: z.string().optional(),
  emiratesIdExpiry: z.string().optional(),
  visaType: z.string().optional(),
  sponsorCompanyId: z.string().optional(),
});

export async function createClient(prevState: any, formData: FormData) {
  let clientId: string;
  try {
    await requirePermission("clients:write");
    const raw = Object.fromEntries(formData.entries());
    const clientType = raw.clientType as string;

    if (clientType === "CORPORATE") {
      const parsed = corporateSchema.parse(raw);
      const client = await db.client.create({
        data: {
          clientType: "CORPORATE",
          leadSource: parsed.leadSource,
          accountStatus: "ACTIVE",
          corporateProfile: {
            create: {
              companyNameEn: parsed.companyNameEn,
              companyNameAr: parsed.companyNameAr || null,
              tradeLicenseNumber: parsed.tradeLicenseNumber,
              licenseType: parsed.licenseType,
              issuingAuthority: parsed.issuingAuthority,
              legalType: parsed.legalType,
              tradeLicenseExpiry: parsed.tradeLicenseExpiry
                ? new Date(parsed.tradeLicenseExpiry)
                : null,
              vatTrn: parsed.vatTrn || null,
              corporateTaxTrn: parsed.corporateTaxTrn || null,
              ejariNumber: parsed.ejariNumber || null,
            },
          },
        },
      });
      clientId = client.id;
    } else {
      const parsed = individualSchema.parse(raw);
      const client = await db.client.create({
        data: {
          clientType: "INDIVIDUAL",
          leadSource: parsed.leadSource,
          accountStatus: "ACTIVE",
          individualProfile: {
            create: {
              fullNameEn: parsed.fullNameEn,
              fullNameAr: parsed.fullNameAr || null,
              passportNumber: parsed.passportNumber,
              nationality: parsed.nationality,
              passportExpiry: parsed.passportExpiry ? new Date(parsed.passportExpiry) : null,
              emiratesIdNumber: parsed.emiratesIdNumber || null,
              emiratesIdExpiry: parsed.emiratesIdExpiry
                ? new Date(parsed.emiratesIdExpiry)
                : null,
              visaType: parsed.visaType,
              sponsorCompanyId: parsed.sponsorCompanyId || null,
            },
          },
        },
      });
      clientId = client.id;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    if (error?.code === "P2002") {
      return { error: "A client with this Trade License Number or specific detail already exists." };
    }
    return { error: error?.message || "An unexpected error occurred." };
  }

  revalidatePath("/clients");
  revalidatePath("/companies");
  redirect(`/clients/${clientId}`);
}

export async function updateAccountStatus(clientId: string, status: AccountStatus) {
  await requirePermission("clients:write");
  await db.client.update({ where: { id: clientId }, data: { accountStatus: status } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function listClients(params: {
  clientType?: ClientType;
  query?: string;
  status?: AccountStatus;
}) {
  await requirePermission("clients:read");
  return db.client.findMany({
    where: {
      clientType: params.clientType,
      accountStatus: params.status,
      OR: params.query
        ? [
            {
              corporateProfile: {
                is: { companyNameEn: { contains: params.query, mode: "insensitive" as const } },
              },
            },
            {
              individualProfile: {
                is: { fullNameEn: { contains: params.query, mode: "insensitive" as const } },
              },
            },
          ]
        : undefined,
    },
    include: { corporateProfile: true, individualProfile: true, assignedPRO: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listClientsPaginated(params: {
  clientType?: ClientType;
  query?: string;
  status?: AccountStatus;
  page: number;
  pageSize: number;
}) {
  await requirePermission("clients:read");
  const where = {
    clientType: params.clientType,
    accountStatus: params.status,
    OR: params.query
      ? [
          {
            corporateProfile: {
              is: { companyNameEn: { contains: params.query, mode: "insensitive" as const } },
            },
          },
          {
            individualProfile: {
              is: { fullNameEn: { contains: params.query, mode: "insensitive" as const } },
            },
          },
        ]
      : undefined,
  };

  const [data, total] = await Promise.all([
    db.client.findMany({
      where,
      include: { corporateProfile: true, individualProfile: true, assignedPRO: true },
      orderBy: { createdAt: "desc" },
      take: params.pageSize,
      skip: (params.page - 1) * params.pageSize,
    }),
    db.client.count({ where }),
  ]);

  return {
    clients: data,
    totalPages: Math.ceil(total / params.pageSize),
    currentPage: params.page,
    totalCount: total,
  };
}

export async function getClient(id: string) {
  await requirePermission("clients:read");
  return db.client.findUnique({
    where: { id },
    include: {
      corporateProfile: true,
      individualProfile: { include: { sponsorCompany: true } },
      documents: { orderBy: { expiryDate: "asc" } },
      workflows: { include: { steps: true }, orderBy: { createdAt: "desc" } },
      assignedPRO: true,
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listCorporateClientsForSponsor() {
  await requirePermission("clients:read");
  return db.corporateProfile.findMany({
    select: { id: true, companyNameEn: true },
    orderBy: { companyNameEn: "asc" },
  });
}

export async function deleteClient(id: string) {
  await requirePermission("clients:write");
  // Prisma will cascade delete profiles/documents if configured, or we can just delete the client
  await db.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(id: string, formData: FormData) {
  await requirePermission("clients:write");
  const raw = Object.fromEntries(formData.entries());

  const str = (key: string) => {
    const v = raw[key];
    return typeof v === "string" ? v.trim() : "";
  };
  const optStr = (key: string) => {
    const v = str(key);
    return v.length > 0 ? v : null;
  };
  const optDate = (key: string) => {
    const v = str(key);
    return v.length > 0 ? new Date(v) : null;
  };
  const has = (key: string) => Object.prototype.hasOwnProperty.call(raw, key);
  const setIfPresent = (target: any, key: string, value: any) => {
    if (has(key)) target[key] = value;
  };

  const client = await db.client.findUnique({
    where: { id },
    select: { clientType: true },
  });
  if (!client) throw new Error("Client not found");

  try {
    const clientData: any = {};
    if (str("leadSource")) clientData.leadSource = str("leadSource");
    if (str("accountStatus")) clientData.accountStatus = str("accountStatus") as AccountStatus;
    setIfPresent(clientData, "code", optStr("code"));
    setIfPresent(clientData, "trn", optStr("trn"));
    setIfPresent(clientData, "notes", optStr("notes"));
    setIfPresent(clientData, "assignedPROId", optStr("assignedPROId"));

    if (client.clientType === "CORPORATE") {
      const p: any = {};
      if (str("companyNameEn")) p.companyNameEn = str("companyNameEn");
      if (str("tradeLicenseNumber")) p.tradeLicenseNumber = str("tradeLicenseNumber");
      if (str("issuingAuthority")) p.issuingAuthority = str("issuingAuthority");
      setIfPresent(p, "companyNameAr", optStr("companyNameAr"));
      setIfPresent(p, "licenseType", optStr("licenseType"));
      setIfPresent(p, "legalType", optStr("legalType"));
      setIfPresent(p, "tradeLicenseExpiry", optDate("tradeLicenseExpiry"));
      setIfPresent(p, "vatTrn", optStr("vatTrn"));
      setIfPresent(p, "corporateTaxTrn", optStr("corporateTaxTrn"));
      setIfPresent(p, "ejariNumber", optStr("ejariNumber"));
      setIfPresent(p, "ejariExpiry", optDate("ejariExpiry"));
      setIfPresent(p, "establishmentCardImmNumber", optStr("establishmentCardImmNumber"));
      setIfPresent(p, "establishmentCardImmExpiry", optDate("establishmentCardImmExpiry"));
      setIfPresent(p, "establishmentCardMohreNumber", optStr("establishmentCardMohreNumber"));
      setIfPresent(p, "establishmentCardMohreExpiry", optDate("establishmentCardMohreExpiry"));
      setIfPresent(p, "authorizedSignatoryName", optStr("authorizedSignatoryName"));
      setIfPresent(p, "authorizedSignatoryPassport", optStr("authorizedSignatoryPassport"));
      setIfPresent(p, "authorizedSignatoryEid", optStr("authorizedSignatoryEid"));
      setIfPresent(p, "authorizedSignatoryMobile", optStr("authorizedSignatoryMobile"));
      setIfPresent(p, "authorizedSignatoryEmail", optStr("authorizedSignatoryEmail"));
      if (Object.keys(p).length > 0) clientData.corporateProfile = { update: p };
    } else {
      const p: any = {};
      if (str("fullNameEn")) p.fullNameEn = str("fullNameEn");
      if (str("passportNumber")) p.passportNumber = str("passportNumber");
      if (str("nationality")) p.nationality = str("nationality");
      setIfPresent(p, "fullNameAr", optStr("fullNameAr"));
      setIfPresent(p, "passportExpiry", optDate("passportExpiry"));
      setIfPresent(p, "emiratesIdNumber", optStr("emiratesIdNumber"));
      setIfPresent(p, "emiratesIdExpiry", optDate("emiratesIdExpiry"));
      setIfPresent(p, "unifiedIdNumber", optStr("unifiedIdNumber"));
      setIfPresent(p, "visaType", optStr("visaType"));
      setIfPresent(p, "visaExpiry", optDate("visaExpiry"));
      setIfPresent(p, "sponsorCompanyId", optStr("sponsorCompanyId"));
      if (Object.keys(p).length > 0) clientData.individualProfile = { update: p };
    }

    await db.client.update({ where: { id }, data: clientData });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "A client with this Trade License Number or specific detail already exists." };
    }
    return { error: error?.message || "An unexpected error occurred." };
  }

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/companies");
}
