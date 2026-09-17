import prisma from "../lib/prisma";

const NEW_SERVICES = [
  { name: "MOHRE Offer Letter Typing", category: "MOHRE & Labour", govFee: 0, agencyFee: 150 },
  { name: "Work Permit Application (New / Renewal)", category: "MOHRE & Labour", govFee: 500, agencyFee: 300 },
  { name: "Entry Permit Typing (New Employment / Residence / Visit)", category: "Immigration & GDRFA", govFee: 1010, agencyFee: 250 },
  { name: "Change of Status", category: "Immigration & GDRFA", govFee: 750, agencyFee: 300 },
  { name: "Medical Fitness Application (Standard / VIP)", category: "Medical Typing & Follow-up", govFee: 320, agencyFee: 150 },
  { name: "Emirates ID Typing (New / Renewal)", category: "UAE Visa & Emirates ID", govFee: 170, agencyFee: 100 },
  { name: "Visa Stamping / Residence Permit", category: "UAE Visa & Emirates ID", govFee: 460, agencyFee: 200 },
  { name: "Golden Visa Nomination & Processing", category: "UAE Visa & Emirates ID", govFee: 2800, agencyFee: 1500 },
  { name: "Company Establishment Card / Trade License Typing", category: "Trade License & Formation", govFee: 2000, agencyFee: 500 },
  { name: "Fine Waiver / Status Rectification", category: "Immigration & GDRFA", govFee: 1000, agencyFee: 300 },
];

async function main() {
  for (const service of NEW_SERVICES) {
    await prisma.serviceItem.upsert({
      where: { name: service.name },
      update: { category: service.category, govFee: service.govFee, agencyFee: service.agencyFee },
      create: { ...service, isVatExempt: false, isActive: true },
    });
    console.log(`Upserted: ${service.name}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
