/**
 * ============================================================================
 *  UAE PRO / Document-Clearance CRM  —  Full end-to-end demo seed
 * ============================================================================
 *
 *  Populates every table with realistic, production-shaped data plus a set of
 *  deliberate edge cases (long strings, Arabic + emoji, zero amounts, overdue
 *  invoices, expired documents, overpayment, unassigned records) so you can
 *  verify UI rendering and every CRM workflow.
 *
 *  Run:
 *     npx tsx prisma/seed-data.ts
 *
 *  It is DESTRUCTIVE for demo tables (clients, workflows, invoices, tasks,
 *  documents, payments, audit logs) but preserves Role rows. It refuses to run
 *  when NODE_ENV === "production" unless SEED_FORCE=1 is set.
 * ============================================================================
 */

import { PrismaClient } from "@prisma/client";


const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const rel = (days: number) => new Date(now + days * DAY);

// A password everyone shares in the demo environment.
const DEMO_PASSWORD = "Passw0rd!";

async function assertSafe() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    throw new Error(
      "Refusing to run destructive seed with NODE_ENV=production. Set SEED_FORCE=1 to override."
    );
  }
}

async function wipe() {
  // Order matters: children before parents.
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.fieldTaskCheckIn.deleteMany(),
    db.task.deleteMany(),
    db.workflowStep.deleteMany(),
    db.workflow.deleteMany(),
    db.payment.deleteMany(),
    db.quotationLineItem.deleteMany(),
    db.quotation.deleteMany(),
    db.document.deleteMany(),
    db.individualProfile.deleteMany(),
    db.corporateProfile.deleteMany(),
    db.client.deleteMany(),
    db.serviceStepDef.deleteMany(),
    db.serviceTemplate.deleteMany(),
  ]);
  // Users: keep it simple, delete all demo users but leave roles.
  await db.user.deleteMany({ where: { email: { contains: "@demo.crm" } } });
}

// ---------------------------------------------------------------------------
// 1. ROLES + USERS
// ---------------------------------------------------------------------------
async function seedRolesAndUsers() {
  const roleDefs = [
    { name: "SUPER_ADMIN", description: "Full visibility, financials, user management." },
    { name: "OPERATIONS_MANAGER", description: "Assigns tasks, manages workflows, approves quotations." },
    { name: "PRO_AGENT", description: "Field PRO: assigned tasks, receipts, reference numbers." },
    { name: "CLIENT_PORTAL", description: "Read-only client access." },
  ];
  for (const r of roleDefs) {
    await db.role.upsert({ where: { name: r.name }, update: { description: r.description }, create: r });
  }
  const roles = Object.fromEntries((await db.role.findMany()).map((r) => [r.name, r.id])) as Record<
    string,
    string
  >;

  const hash = null;
  const mk = (name: string, email: string, roleName: string, phone?: string, isActive = true) =>
    db.user.create({
      data: { name, email, passwordHash: hash, phone: phone ?? null, roleId: roles[roleName], isActive },
    });

  const admin = await mk("Layla Al Farsi", "admin@demo.crm", "SUPER_ADMIN", "+971 50 111 1111");
  const ops = await mk("Marcus Reyes", "ops@demo.crm", "OPERATIONS_MANAGER", "+971 50 222 2222");
  const pro1 = await mk("Ahmed Ali", "ahmed.pro@demo.crm", "PRO_AGENT", "+971 55 333 3333");
  const pro2 = await mk("Priya Nair", "priya.pro@demo.crm", "PRO_AGENT", "+971 56 444 4444");
  const proInactive = await mk("Former Agent", "old.pro@demo.crm", "PRO_AGENT", "+971 50 000 0000", false);

  return { roles, admin, ops, pro1, pro2, proInactive };
}

// ---------------------------------------------------------------------------
// 2. SERVICE TEMPLATES
// ---------------------------------------------------------------------------
async function seedTemplates() {
  const employmentVisa = await db.serviceTemplate.create({
    data: {
      name: "New Employment Visa",
      category: "EMPLOYMENT_VISA",
      description: "Inside-country employment visa, quota to eVisa.",
      stepDefs: {
        create: [
          { order: 1, name: "Quota Approval" },
          { order: 2, name: "Offer Letter / Job Contract" },
          { order: 3, name: "Entry Permit" },
          { order: 4, name: "Status Change" },
          { order: 5, name: "Medical Test" },
          { order: 6, name: "Emirates ID Biometrics" },
          { order: 7, name: "Visa Stamping / eVisa Issuance" },
        ],
      },
    },
  });

  const tradeLicense = await db.serviceTemplate.create({
    data: {
      name: "Trade License Setup / Renewal",
      category: "TRADE_LICENSE_SETUP",
      stepDefs: {
        create: [
          { order: 1, name: "Initial Approval" },
          { order: 2, name: "Trade Name Reservation" },
          { order: 3, name: "Ejari / Virtual Lease" },
          { order: 4, name: "MOA Notarization" },
          { order: 5, name: "Final License Issuance" },
        ],
      },
    },
  });

  const attestation = await db.serviceTemplate.create({
    data: {
      name: "Document Attestation & MOFA",
      category: "DOCUMENT_ATTESTATION",
      stepDefs: {
        create: [
          { order: 1, name: "Notary" },
          { order: 2, name: "MOFA" },
          { order: 3, name: "Embassy Legalization" },
        ],
      },
    },
  });

  return { employmentVisa, tradeLicense, attestation };
}

// ---------------------------------------------------------------------------
// 3. CLIENTS  (corporate + individual, incl. edge cases)
// ---------------------------------------------------------------------------
async function seedClients(ctx: Awaited<ReturnType<typeof seedRolesAndUsers>>) {
  // --- Corporate #1: healthy, fully populated ---
  const acme = await db.client.create({
    data: {
      clientType: "CORPORATE",
      accountStatus: "ACTIVE",
      leadSource: "REFERRAL",
      assignedPROId: ctx.pro1.id,
      notes: "Priority account. Renews 3 visas annually.",
      corporateProfile: {
        create: {
          companyNameEn: "Acme Trading & Logistics LLC",
          companyNameAr: "شركة أكمي للتجارة والخدمات اللوجستية ذ.م.م",
          tradeLicenseNumber: "CN-1043829",
          licenseType: "COMMERCIAL",
          issuingAuthority: "DED",
          legalType: "LLC",
          tradeLicenseExpiry: rel(48),
          establishmentCardImmNumber: "IMM-90233421",
          establishmentCardImmExpiry: rel(48),
          establishmentCardMohreNumber: "MB-77120",
          establishmentCardMohreExpiry: rel(12), // due soon
          corporateTaxTrn: "100234500600003",
          vatTrn: "100234500600003",
          ejariNumber: "EJ-2024-558210",
          ejariExpiry: rel(120),
          tenancyUnitDetails: "Office 1204, Prism Tower, Business Bay, Dubai",
          authorizedSignatoryName: "Khalid Rahman",
          authorizedSignatoryPassport: "P4432199",
          authorizedSignatoryEid: "784-1988-1234567-1",
          authorizedSignatoryMobile: "+971 50 987 6543",
          authorizedSignatoryEmail: "khalid@acme-trading.ae",
        },
      },
    },
    include: { corporateProfile: true },
  });

  // --- Corporate #2: free zone, license already EXPIRED (edge case) ---
  const zenith = await db.client.create({
    data: {
      clientType: "CORPORATE",
      accountStatus: "ACTIVE",
      leadSource: "WHATSAPP",
      assignedPROId: ctx.pro2.id,
      corporateProfile: {
        create: {
          companyNameEn: "Zenith Digital FZ-LLC",
          companyNameAr: "زينيث ديجيتال",
          tradeLicenseNumber: "IFZA-25540",
          licenseType: "PROFESSIONAL",
          issuingAuthority: "IFZA",
          legalType: "FREE_ZONE_ENTITY",
          tradeLicenseExpiry: rel(-9), // EXPIRED
          establishmentCardImmExpiry: rel(-9),
          vatTrn: "100999888777003",
          authorizedSignatoryName: "Elena Petrova",
          authorizedSignatoryEmail: "elena@zenith.digital",
          authorizedSignatoryMobile: "+971 52 100 2003",
        },
      },
    },
    include: { corporateProfile: true },
  });

  // --- Corporate #3: prospect, minimal data (edge case: sparse record) ---
  const prospectCo = await db.client.create({
    data: {
      clientType: "CORPORATE",
      accountStatus: "PROSPECT",
      leadSource: "PORTAL",
      corporateProfile: {
        create: {
          companyNameEn: "Untitled Holding (pending trade name)",
          tradeLicenseNumber: "PENDING-" + Date.now(),
          issuingAuthority: "DED",
        },
      },
    },
    include: { corporateProfile: true },
  });

  // --- Corporate #4: long-string / unicode stress test ---
  const longName = await db.client.create({
    data: {
      clientType: "CORPORATE",
      accountStatus: "INACTIVE",
      leadSource: "OTHER",
      notes:
        "Lorem ipsum ".repeat(40) +
        " — contains <script>alert('xss')</script> and emoji 🏢🇦🇪 and quotes \" ' ` and unicode ✓ ∑ ملاحظات.",
      corporateProfile: {
        create: {
          companyNameEn:
            "Al Maha International General Trading, Contracting, Facilities Management & Multi-Sector Investment Company (Sole Proprietorship) LLC",
          companyNameAr: "الماها الدولية للتجارة العامة والمقاولات وإدارة المرافق والاستثمار متعدد القطاعات",
          tradeLicenseNumber: "CN-9900001",
          licenseType: "COMMERCIAL",
          issuingAuthority: "DED",
          legalType: "SOLE_ESTABLISHMENT",
          tradeLicenseExpiry: rel(400),
          vatTrn: "100000000000003",
        },
      },
    },
    include: { corporateProfile: true },
  });

  // --- Individual #1: employee sponsored by Acme, visa due soon ---
  const johnDoe = await db.client.create({
    data: {
      clientType: "INDIVIDUAL",
      accountStatus: "ACTIVE",
      leadSource: "FIELD_AGENT",
      assignedPROId: ctx.pro1.id,
      individualProfile: {
        create: {
          fullNameEn: "John Michael O'Brien-Vandersteen",
          fullNameAr: "جون مايكل",
          passportNumber: "N1234567",
          nationality: "Irish",
          passportExpiry: rel(300),
          emiratesIdNumber: "784-1990-7654321-2",
          emiratesIdExpiry: rel(25), // DUE_30
          unifiedIdNumber: "201/2019/1234567",
          visaType: "EMPLOYMENT",
          visaExpiry: rel(25),
          sponsorCompanyId: acme.corporateProfile!.id,
        },
      },
    },
  });

  // --- Individual #2: investor, everything current ---
  const investor = await db.client.create({
    data: {
      clientType: "INDIVIDUAL",
      accountStatus: "ACTIVE",
      leadSource: "REFERRAL",
      assignedPROId: ctx.pro2.id,
      individualProfile: {
        create: {
          fullNameEn: "Fatima Al Zahra",
          fullNameAr: "فاطمة الزهراء",
          passportNumber: "A98765432",
          nationality: "Emirati",
          passportExpiry: rel(1200),
          emiratesIdNumber: "784-1985-1111111-1",
          emiratesIdExpiry: rel(700),
          visaType: "INVESTOR_PARTNER",
          visaExpiry: rel(700),
        },
      },
    },
  });

  // --- Individual #3: prospect, passport already expired (edge case) ---
  const expiredIndiv = await db.client.create({
    data: {
      clientType: "INDIVIDUAL",
      accountStatus: "PROSPECT",
      leadSource: "WALK_IN",
      individualProfile: {
        create: {
          fullNameEn: "Ravi Kumar",
          passportNumber: "K5566778",
          nationality: "Indian",
          passportExpiry: rel(-60), // EXPIRED
          visaType: "VISIT",
          visaExpiry: rel(-15),
        },
      },
    },
  });

  // --- Individual #4: archived ---
  const archived = await db.client.create({
    data: {
      clientType: "INDIVIDUAL",
      accountStatus: "ARCHIVED",
      leadSource: "OTHER",
      individualProfile: {
        create: {
          fullNameEn: "Chen Wei",
          passportNumber: "E1122334",
          nationality: "Chinese",
        },
      },
    },
  });

  return { acme, zenith, prospectCo, longName, johnDoe, investor, expiredIndiv, archived };
}

// ---------------------------------------------------------------------------
// 4. DOCUMENTS  (every expiry tier + verification status)
// ---------------------------------------------------------------------------
async function seedDocuments(
  clients: Awaited<ReturnType<typeof seedClients>>,
  ctx: Awaited<ReturnType<typeof seedRolesAndUsers>>
) {
  const doc = (
    clientId: string,
    category: string,
    fileName: string,
    days: number | null,
    verificationStatus: string
  ) =>
    db.document.create({
      data: {
        clientId,
        category,
        fileName,
        fileUrl: `https://storage.demo.crm/${category.toLowerCase()}/${encodeURIComponent(fileName)}`,
        mimeType: "application/pdf",
        expiryDate: days === null ? null : rel(days),
        verificationStatus,
        uploadedById: ctx.pro1.id,
      },
    });

  await doc(clients.acme.id, "TRADE_LICENSE", "Acme-TradeLicense-2024.pdf", 48, "VERIFIED_VALID");
  await doc(clients.acme.id, "ESTABLISHMENT_CARD", "Acme-EstCard-MOHRE.pdf", 12, "VERIFIED_VALID"); // DUE_30
  await doc(clients.acme.id, "TENANCY_CONTRACT", "Acme-Ejari.pdf", 120, "PENDING_REVIEW");
  await doc(clients.zenith.id, "TRADE_LICENSE", "Zenith-License.pdf", -9, "EXPIRED"); // EXPIRED
  await doc(clients.johnDoe.id, "PASSPORT", "OBrien-Passport.pdf", 300, "VERIFIED_VALID");
  await doc(clients.johnDoe.id, "EMIRATES_ID", "OBrien-EID.pdf", 25, "VERIFIED_VALID"); // DUE_30
  await doc(clients.johnDoe.id, "VISA", "OBrien-eVisa.pdf", 25, "PENDING_REVIEW");
  await doc(clients.investor.id, "PASSPORT", "AlZahra-Passport.pdf", 1200, "VERIFIED_VALID");
  await doc(clients.investor.id, "VISA", "AlZahra-InvestorVisa.pdf", 700, "VERIFIED_VALID");
  await doc(clients.expiredIndiv.id, "VISA", "Kumar-VisitVisa.pdf", -15, "EXPIRED");
  await doc(clients.expiredIndiv.id, "PASSPORT", "Kumar-Passport.pdf", -60, "REJECTED");
  await doc(clients.longName.id, "MEMORANDUM", "MOA " + "very-long-filename-".repeat(10) + ".pdf", 400, "PENDING_REVIEW");
  await doc(clients.acme.id, "NOC", "Acme-NOC-no-expiry.pdf", null, "VERIFIED_VALID"); // no expiry
}

// ---------------------------------------------------------------------------
// 5. WORKFLOWS + STEPS + FIELD TASKS + CHECK-INS
// ---------------------------------------------------------------------------
async function seedWorkflows(
  clients: Awaited<ReturnType<typeof seedClients>>,
  templates: Awaited<ReturnType<typeof seedTemplates>>,
  ctx: Awaited<ReturnType<typeof seedRolesAndUsers>>
) {
  // Workflow A: employment visa for John, mid-progress, one step needs action.
  const wfA = await db.workflow.create({
    data: {
      clientId: clients.johnDoe.id,
      templateId: templates.employmentVisa.id,
      name: templates.employmentVisa.name,
      category: templates.employmentVisa.category,
      steps: {
        create: [
          { order: 1, name: "Quota Approval", status: "COMPLETED", assigneeId: ctx.pro1.id, fee: 250, mohreTxnNumber: "MB-TX-8890021", completedAt: rel(-20) },
          { order: 2, name: "Offer Letter / Job Contract", status: "COMPLETED", assigneeId: ctx.pro1.id, fee: 300, completedAt: rel(-16) },
          { order: 3, name: "Entry Permit", status: "COMPLETED", assigneeId: ctx.pro1.id, fee: 1150, icpGdrfaRefNumber: "ICP-EP-55231", completedAt: rel(-9) },
          { order: 4, name: "Status Change", status: "IN_PROGRESS", assigneeId: ctx.pro1.id, fee: 650, dueDate: rel(2) },
          { order: 5, name: "Medical Test", status: "ACTION_REQUIRED", assigneeId: ctx.pro2.id, dueDate: rel(-1), fee: 320 },
          { order: 6, name: "Emirates ID Biometrics", status: "PENDING" },
          { order: 7, name: "Visa Stamping / eVisa Issuance", status: "PENDING", fee: 500 },
        ],
      },
    },
    include: { steps: true },
  });

  // Workflow B: trade license renewal for Zenith (expired license), fully completed.
  const wfB = await db.workflow.create({
    data: {
      clientId: clients.zenith.id,
      templateId: templates.tradeLicense.id,
      name: templates.tradeLicense.name,
      category: templates.tradeLicense.category,
      completedAt: rel(-2),
      steps: {
        create: [
          { order: 1, name: "Initial Approval", status: "COMPLETED", assigneeId: ctx.pro2.id, completedAt: rel(-14) },
          { order: 2, name: "Trade Name Reservation", status: "COMPLETED", assigneeId: ctx.pro2.id, completedAt: rel(-12) },
          { order: 3, name: "Ejari / Virtual Lease", status: "COMPLETED", assigneeId: ctx.pro2.id, completedAt: rel(-8) },
          { order: 4, name: "MOA Notarization", status: "COMPLETED", assigneeId: ctx.pro2.id, completedAt: rel(-5) },
          { order: 5, name: "Final License Issuance", status: "COMPLETED", assigneeId: ctx.pro2.id, completedAt: rel(-2) },
        ],
      },
    },
    include: { steps: true },
  });

  // Workflow C: fresh attestation for Acme, nothing started.
  const wfC = await db.workflow.create({
    data: {
      clientId: clients.acme.id,
      templateId: templates.attestation.id,
      name: templates.attestation.name,
      category: templates.attestation.category,
      steps: {
        create: [
          { order: 1, name: "Notary", status: "PENDING" },
          { order: 2, name: "MOFA", status: "PENDING" },
          { order: 3, name: "Embassy Legalization", status: "PENDING" },
        ],
      },
    },
    include: { steps: true },
  });

  // Field tasks — bound to steps, dispatched to PROs. Cover overdue / today / future / done.
  const statusChangeStep = wfA.steps.find((s) => s.order === 4)!;
  const medicalStep = wfA.steps.find((s) => s.order === 5)!;

  const t1 = await db.task.create({
    data: {
      workflowStepId: statusChangeStep.id,
      title: "Submit status-change file at Amer Center",
      venue: "AMER_CENTER",
      status: "IN_PROGRESS",
      assigneeId: ctx.pro1.id,
      dueDate: rel(0), // today
      notes: "Bring original passport + entry permit printout.",
    },
  });

  const t2 = await db.task.create({
    data: {
      workflowStepId: medicalStep.id,
      title: "Accompany applicant to medical fitness screening",
      venue: "MEDICAL_FITNESS",
      status: "ACTION_REQUIRED",
      assigneeId: ctx.pro2.id,
      dueDate: rel(-1), // overdue
      notes: "Applicant rescheduled once already.",
    },
  });

  const t3 = await db.task.create({
    data: {
      title: "Collect stamped MOA from notary (ad-hoc, no workflow)",
      venue: "E_NOTARY",
      status: "COMPLETED",
      assigneeId: ctx.pro1.id,
      dueDate: rel(-3),
    },
  });

  const t4 = await db.task.create({
    data: {
      title: "Embassy legalization drop-off",
      venue: "EMBASSY",
      status: "PENDING",
      assigneeId: ctx.pro2.id,
      dueDate: rel(5),
    },
  });

  // Check-ins with geolocation (Dubai coordinates) + one without.
  await db.fieldTaskCheckIn.create({
    data: { taskId: t1.id, userId: ctx.pro1.id, latitude: 25.2631, longitude: 55.2972, note: "Arrived at Amer Center, token #142." },
  });
  await db.fieldTaskCheckIn.create({
    data: { taskId: t3.id, userId: ctx.pro1.id, latitude: 25.1972, longitude: 55.2744, note: "Collected. Handed to office." },
  });
  await db.fieldTaskCheckIn.create({
    data: { taskId: t2.id, userId: ctx.pro2.id, note: "Applicant no-show. Awaiting new slot." },
  });

  return { wfA, wfB, wfC };
}

// 8. AUDIT LOG
// ---------------------------------------------------------------------------
async function seedLedgerAndAudit(
  clients: Awaited<ReturnType<typeof seedClients>>,
  ctx: Awaited<ReturnType<typeof seedRolesAndUsers>>
) {
  await db.auditLog.createMany({
    data: [
      { userId: ctx.pro1.id, action: "UPDATE", entity: "WorkflowStep", entityId: "entry-permit", after: JSON.stringify({ status: "COMPLETED" }) },
      { userId: ctx.admin.id, action: "CREATE", entity: "User", entityId: "priya.pro@demo.crm" },
      { userId: null, action: "LOGIN_FAILED", entity: "Auth", entityId: "unknown@demo.crm" },
    ],
  });
}

// ---------------------------------------------------------------------------
async function main() {
  await assertSafe();
  console.log("Wiping demo data…");
  await wipe();

  console.log("Seeding roles + users…");
  const ctx = await seedRolesAndUsers();

  console.log("Seeding service templates…");
  const templates = await seedTemplates();

  console.log("Seeding clients…");
  const clients = await seedClients(ctx);

  console.log("Seeding documents…");
  await seedDocuments(clients, ctx);

  console.log("Seeding workflows, steps, field tasks…");
  await seedWorkflows(clients, templates, ctx);

  console.log("Seeding ledger + audit log…");
  await seedLedgerAndAudit(clients, ctx);

  console.log("\n✅ Seed complete.");
  console.log("   Login with any of:");
  console.log("     admin@demo.crm / ops@demo.crm / ahmed.pro@demo.crm / priya.pro@demo.crm");
  console.log(`   Password for all: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
