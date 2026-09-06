import { PrismaClient } from "@prisma/client";


const db = new PrismaClient();

async function main() {
  // ---- Roles ----
  const roleDefs: { name: string; description: string }[] = [
    { name: "SUPER_ADMIN", description: "Full visibility, financial analytics, revenue reports, user permissions." },
    { name: "OPERATIONS_MANAGER", description: "Assigns tasks to PROs, manages workflows, approves quotations." },
    { name: "PRO_AGENT", description: "Views assigned field tasks, uploads receipts/stamped documents." },
    { name: "CLIENT_PORTAL", description: "Read-only client access: documents, progress tracking, invoices." },
  ];

  const roles = await Promise.all(
    roleDefs.map((r) =>
      db.role.upsert({ where: { name: r.name }, update: {}, create: r })
    )
  );

  const superAdminRole = roles.find((r) => r.name === "SUPER_ADMIN")!;

  // ---- Seed super admin user ----
  await db.user.upsert({
    where: { email: "admin@agency.ae" },
    update: {},
    create: {
      name: "Agency Admin",
      email: "admin@agency.ae",
      passwordHash: null,
      roleId: superAdminRole.id,
    },
  });

  // ---- Service templates (Section B step progressions) ----
  await db.serviceTemplate.upsert({
    where: { id: "svc-employment-visa" },
    update: {
      description: "End-to-end processing for a new UAE employment visa, including medical and Emirates ID.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Quota Approval", description: "Secure approval for the required visa quota." },
          { order: 2, name: "Offer Letter / Job Contract", description: "Draft and sign MOHRE offer letter." },
          { order: 3, name: "Entry Permit", description: "Issue the pink visa (entry permit)." },
          { order: 4, name: "Status Change", description: "Change status from tourist/cancelled to new visa." },
          { order: 5, name: "Medical Test", description: "Complete medical fitness examination." },
          { order: 6, name: "Emirates ID Biometrics", description: "Fingerprints and photo for EID." },
          { order: 7, name: "Visa Stamping / Residency eVisa Issuance", description: "Final residency visa approval." },
        ],
      },
    },
    create: {
      id: "svc-employment-visa",
      name: "New Employment Visa",
      category: "EMPLOYMENT_VISA",
      description: "End-to-end processing for a new UAE employment visa, including medical and Emirates ID.",
      stepDefs: {
        create: [
          { order: 1, name: "Quota Approval", description: "Secure approval for the required visa quota." },
          { order: 2, name: "Offer Letter / Job Contract", description: "Draft and sign MOHRE offer letter." },
          { order: 3, name: "Entry Permit", description: "Issue the pink visa (entry permit)." },
          { order: 4, name: "Status Change", description: "Change status from tourist/cancelled to new visa." },
          { order: 5, name: "Medical Test", description: "Complete medical fitness examination." },
          { order: 6, name: "Emirates ID Biometrics", description: "Fingerprints and photo for EID." },
          { order: 7, name: "Visa Stamping / Residency eVisa Issuance", description: "Final residency visa approval." },
        ],
      },
    },
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-trade-license" },
    update: {
      description: "Complete process for Mainland or Free Zone trade license setup and renewals.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Initial Approval", description: "DED initial approval and activity clearance." },
          { order: 2, name: "Trade Name Reservation", description: "Register and reserve the official company name." },
          { order: 3, name: "Ejari / Virtual Lease", description: "Establish the physical or virtual office address." },
          { order: 4, name: "MOA Notarization", description: "Sign and notarize the Memorandum of Association." },
          { order: 5, name: "Final License Issuance", description: "Pay fees and receive the final trade license." },
        ],
      },
    },
    create: {
      id: "svc-trade-license",
      name: "Trade License Setup / Renewal",
      category: "TRADE_LICENSE_SETUP",
      description: "Complete process for Mainland or Free Zone trade license setup and renewals.",
      stepDefs: {
        create: [
          { order: 1, name: "Initial Approval", description: "DED initial approval and activity clearance." },
          { order: 2, name: "Trade Name Reservation", description: "Register and reserve the official company name." },
          { order: 3, name: "Ejari / Virtual Lease", description: "Establish the physical or virtual office address." },
          { order: 4, name: "MOA Notarization", description: "Sign and notarize the Memorandum of Association." },
          { order: 5, name: "Final License Issuance", description: "Pay fees and receive the final trade license." },
        ],
      },
    },
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-attestation" },
    update: {
      description: "Legalization of personal and corporate documents for use in the UAE.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Notary", description: "Local notary public attestation in the home country." },
          { order: 2, name: "MOFA (Ministry of Foreign Affairs)", description: "Home country MOFA attestation." },
          { order: 3, name: "Embassy Legalization", description: "UAE Embassy attestation in the home country." },
        ],
      },
    },
    create: {
      id: "svc-attestation",
      name: "Document Attestation & MOFA",
      category: "DOCUMENT_ATTESTATION",
      description: "Legalization of personal and corporate documents for use in the UAE.",
      stepDefs: {
        create: [
          { order: 1, name: "Notary", description: "Local notary public attestation in the home country." },
          { order: 2, name: "MOFA (Ministry of Foreign Affairs)", description: "Home country MOFA attestation." },
          { order: 3, name: "Embassy Legalization", description: "UAE Embassy attestation in the home country." },
        ],
      },
    },
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-golden-visa" },
    update: {
      description: "10-Year UAE Golden Visa processing for Investors, Specialists, or Exceptional Talents.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Initial Nomination Approval", description: "Submit application to GDRFA/ICP for nomination." },
          { order: 2, name: "Cancel Existing Visa", description: "If applicable, cancel the current residency visa." },
          { order: 3, name: "Medical Fitness Test", description: "Complete VIP medical examination." },
          { order: 4, name: "Emirates ID Biometrics", description: "Fingerprints and photo capturing." },
          { order: 5, name: "Visa Stamping", description: "Issuance of the 10-year residency visa." }
        ]
      }
    },
    create: {
      id: "svc-golden-visa",
      name: "UAE Golden Visa",
      category: "GOLDEN_VISA",
      description: "10-Year UAE Golden Visa processing for Investors, Specialists, or Exceptional Talents.",
      stepDefs: {
        create: [
          { order: 1, name: "Initial Nomination Approval", description: "Submit application to GDRFA/ICP for nomination." },
          { order: 2, name: "Cancel Existing Visa", description: "If applicable, cancel the current residency visa." },
          { order: 3, name: "Medical Fitness Test", description: "Complete VIP medical examination." },
          { order: 4, name: "Emirates ID Biometrics", description: "Fingerprints and photo capturing." },
          { order: 5, name: "Visa Stamping", description: "Issuance of the 10-year residency visa." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-family-visa" },
    update: {
      description: "Sponsorship of spouse and children for UAE residency.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "File Opening", description: "Open sponsor file at GDRFA." },
          { order: 2, name: "Entry Permit", description: "Issue entry permit for dependents." },
          { order: 3, name: "Status Change", description: "In-country status adjustment." },
          { order: 4, name: "Medical & Emirates ID", description: "Medical test and EID application." },
          { order: 5, name: "Visa Stamping", description: "Final residency visa approval." }
        ]
      }
    },
    create: {
      id: "svc-family-visa",
      name: "Family / Dependent Visa",
      category: "DEPENDENT_VISA",
      description: "Sponsorship of spouse and children for UAE residency.",
      stepDefs: {
        create: [
          { order: 1, name: "File Opening", description: "Open sponsor file at GDRFA." },
          { order: 2, name: "Entry Permit", description: "Issue entry permit for dependents." },
          { order: 3, name: "Status Change", description: "In-country status adjustment." },
          { order: 4, name: "Medical & Emirates ID", description: "Medical test and EID application." },
          { order: 5, name: "Visa Stamping", description: "Final residency visa approval." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-mofa-attestation" },
    update: {
      description: "Certification by the UAE Ministry of Foreign Affairs confirming a document's authenticity for official use.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Document Review", description: "Verify document is ready for MOFA." },
          { order: 2, name: "Submission to MOFA", description: "Submit document for attestation." },
          { order: 3, name: "Collection & Dispatch", description: "Collect attested document and dispatch to client." }
        ]
      }
    },
    create: {
      id: "svc-mofa-attestation",
      name: "MOFA Attestation",
      category: "DOCUMENT_ATTESTATION",
      description: "Certification by the UAE Ministry of Foreign Affairs confirming a document's authenticity for official use.",
      stepDefs: {
        create: [
          { order: 1, name: "Document Review", description: "Verify document is ready for MOFA." },
          { order: 2, name: "Submission to MOFA", description: "Submit document for attestation." },
          { order: 3, name: "Collection & Dispatch", description: "Collect attested document and dispatch to client." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-embassy-legalization" },
    update: {
      description: "Authentication by the relevant embassy or consulate in the UAE for foreign-issued documents.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Document Review", description: "Verify prerequisites for embassy legalization." },
          { order: 2, name: "Embassy Submission", description: "Submit document to the respective embassy." },
          { order: 3, name: "Collection & Dispatch", description: "Collect legalized document and return." }
        ]
      }
    },
    create: {
      id: "svc-embassy-legalization",
      name: "Embassy & Consulate Legalization",
      category: "DOCUMENT_ATTESTATION",
      description: "Authentication by the relevant embassy or consulate in the UAE for foreign-issued documents.",
      stepDefs: {
        create: [
          { order: 1, name: "Document Review", description: "Verify prerequisites for embassy legalization." },
          { order: 2, name: "Embassy Submission", description: "Submit document to the respective embassy." },
          { order: 3, name: "Collection & Dispatch", description: "Collect legalized document and return." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-notary-public" },
    update: {
      description: "Witnessing signatures and verifying identities for documents like powers of attorney, memorandums of association, and contracts.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Draft Preparation", description: "Draft the required legal document." },
          { order: 2, name: "Notary Appointment", description: "Book appointment with the Notary Public." },
          { order: 3, name: "Witnessing & Signatures", description: "Client attends notary for witnessing." },
          { order: 4, name: "Final Notarization", description: "Document officially notarized." }
        ]
      }
    },
    create: {
      id: "svc-notary-public",
      name: "Notary Public Services",
      category: "LEGAL_SERVICES",
      description: "Witnessing signatures and verifying identities for documents like powers of attorney, memorandums of association, and contracts.",
      stepDefs: {
        create: [
          { order: 1, name: "Draft Preparation", description: "Draft the required legal document." },
          { order: 2, name: "Notary Appointment", description: "Book appointment with the Notary Public." },
          { order: 3, name: "Witnessing & Signatures", description: "Client attends notary for witnessing." },
          { order: 4, name: "Final Notarization", description: "Document officially notarized." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-legal-translation" },
    update: {
      description: "Converting documents into Arabic by licensed translators, which is mandatory for most official submissions.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Document Assessment", description: "Assess document for translation scope." },
          { order: 2, name: "Translation", description: "Translate content into Arabic." },
          { order: 3, name: "Certification", description: "Certify and stamp translation by Ministry of Justice approved translator." },
          { order: 4, name: "Delivery", description: "Deliver translated document to client." }
        ]
      }
    },
    create: {
      id: "svc-legal-translation",
      name: "Certified Legal Translation",
      category: "LEGAL_SERVICES",
      description: "Converting documents into Arabic by licensed translators, which is mandatory for most official submissions.",
      stepDefs: {
        create: [
          { order: 1, name: "Document Assessment", description: "Assess document for translation scope." },
          { order: 2, name: "Translation", description: "Translate content into Arabic." },
          { order: 3, name: "Certification", description: "Certify and stamp translation by Ministry of Justice approved translator." },
          { order: 4, name: "Delivery", description: "Deliver translated document to client." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-certificate-attestation" },
    update: {
      description: "Specific verification for educational degrees, birth/marriage certificates, and police clearance certificates.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Home Country Attestation", description: "Get attestation from the issuing country." },
          { order: 2, name: "UAE Embassy Attestation", description: "Attestation by UAE Embassy in home country." },
          { order: 3, name: "MOFA Attestation", description: "Final attestation by UAE MOFA." },
          { order: 4, name: "Delivery", description: "Deliver fully attested certificate." }
        ]
      }
    },
    create: {
      id: "svc-certificate-attestation",
      name: "Certificate Attestation",
      category: "DOCUMENT_ATTESTATION",
      description: "Specific verification for educational degrees, birth/marriage certificates, and police clearance certificates.",
      stepDefs: {
        create: [
          { order: 1, name: "Home Country Attestation", description: "Get attestation from the issuing country." },
          { order: 2, name: "UAE Embassy Attestation", description: "Attestation by UAE Embassy in home country." },
          { order: 3, name: "MOFA Attestation", description: "Final attestation by UAE MOFA." },
          { order: 4, name: "Delivery", description: "Deliver fully attested certificate." }
        ]
      }
    }
  });

  await db.serviceTemplate.upsert({
    where: { id: "svc-general-pro-services" },
    update: {
      description: "Professional document clearing assistance for trade license renewals, visa processing, and government liaison.",
      stepDefs: {
        deleteMany: {},
        create: [
          { order: 1, name: "Requirements Gathering", description: "Collect all required docs for the process." },
          { order: 2, name: "Application Submission", description: "Submit applications to relevant government bodies." },
          { order: 3, name: "Government Liaison", description: "Follow up and process clearances." },
          { order: 4, name: "Completion", description: "Handover completed documents/licenses." }
        ]
      }
    },
    create: {
      id: "svc-general-pro-services",
      name: "PRO Services",
      category: "GENERAL_PRO",
      description: "Professional document clearing assistance for trade license renewals, visa processing, and government liaison.",
      stepDefs: {
        create: [
          { order: 1, name: "Requirements Gathering", description: "Collect all required docs for the process." },
          { order: 2, name: "Application Submission", description: "Submit applications to relevant government bodies." },
          { order: 3, name: "Government Liaison", description: "Follow up and process clearances." },
          { order: 4, name: "Completion", description: "Handover completed documents/licenses." }
        ]
      }
    }
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
