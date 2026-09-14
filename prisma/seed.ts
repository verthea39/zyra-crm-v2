import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Clean the database gracefully
  console.log('Cleaning existing data (cascading deletes will handle relations)...');
  await prisma.portalTransaction.deleteMany();
  await prisma.portalWallet.deleteMany();
  await prisma.whatsAppLog.deleteMany();
  await prisma.documentChecklist.deleteMany();
  await prisma.caseFile.deleteMany();
  await prisma.documentVault.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create a PRO User
  console.log('Creating Admin User...');
  const admin = await prisma.user.create({
    data: {
      name: 'Ahmed PRO',
      email: 'ahmed@zyra.ae',
      role: 'ADMIN',
    },
  });

  // 2. B2B Companies & Clients
  console.log('Creating Clients...');
  const corp1 = await prisma.client.create({
    data: {
      name: 'Al Rostamani Logistics LLC',
      type: 'CORPORATE',
      email: 'hr@alrostamanilogistics.ae',
      phone: '971501234567',
      tradeLicenseNo: 'CN-1234567',
      expiryDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // Due soon (22 days)
    },
  });

  const corp2 = await prisma.client.create({
    data: {
      name: 'Apex Global Tech FZCO',
      type: 'CORPORATE',
      email: 'admin@apexglobal.ae',
      phone: '971556789012',
      tradeLicenseNo: 'FZ-9876543',
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Active
    },
  });

  const individual = await prisma.client.create({
    data: {
      name: 'Mohammed Al-Falasi',
      type: 'INDIVIDUAL',
      email: 'm.alfalasi@gmail.com',
      phone: '971523456789',
    },
  });

  // 3. Employees
  console.log('Creating Employees...');
  const emp1 = await prisma.employee.create({
    data: {
      name: 'Sarah Connor',
      designation: 'Operations Manager',
      corporateId: corp1.id,
    }
  });

  const emp2 = await prisma.employee.create({
    data: {
      name: 'John Doe',
      designation: 'PRO',
      corporateId: corp1.id,
    }
  });

  const emp3 = await prisma.employee.create({
    data: {
      name: 'Tariq Ali',
      designation: 'Heavy Driver',
      corporateId: corp2.id,
    }
  });

  // 4. Document Vault
  console.log('Seeding Document Vault...');
  await prisma.documentVault.create({
    data: {
      title: 'Emirates ID - Sarah Connor',
      category: 'EMIRATES_ID',
      fileUrl: '/uploads/eid-sarah.pdf',
      clientId: corp1.id,
      employeeId: emp1.id,
      expiryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // Critical (< 15 days)
    }
  });

  await prisma.documentVault.create({
    data: {
      title: 'Trade License - Al Rostamani',
      category: 'TRADE_LICENSE',
      fileUrl: '/uploads/license-rostamani.pdf',
      clientId: corp1.id,
      expiryDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // Due soon
    }
  });

  await prisma.documentVault.create({
    data: {
      title: 'Passport - Mohammed',
      category: 'PASSPORT',
      fileUrl: '/uploads/passport-mohammed.pdf',
      clientId: individual.id,
      expiryDate: new Date(Date.now() + 3000 * 24 * 60 * 60 * 1000), // Active
    }
  });

  await prisma.documentVault.create({
    data: {
      title: 'Establishment Card - Apex',
      category: 'ESTABLISHMENT_CARD',
      fileUrl: '/uploads/est-card-apex.pdf',
      clientId: corp2.id,
      expiryDate: new Date(Date.now() + 265 * 24 * 60 * 60 * 1000), // Active
    }
  });

  // 5. Application Pipeline (Cases)
  console.log('Seeding Application Pipeline...');
  const case1 = await prisma.caseFile.create({
    data: {
      reference: 'MOHRE-2026-001',
      applicantName: 'Sarah Connor',
      serviceType: 'New Employment Visa',
      stage: 'OFFER_LETTER_MOHRE',
      clientId: corp1.id,
      coordinatorId: admin.id,
    }
  });

  const case2 = await prisma.caseFile.create({
    data: {
      reference: 'GDRFA-2026-089',
      applicantName: 'Tariq Ali',
      serviceType: 'Visa Stamping',
      stage: 'VISA_STAMPING_EID',
      clientId: corp2.id,
      coordinatorId: admin.id,
    }
  });

  const case3 = await prisma.caseFile.create({
    data: {
      reference: 'MED-2026-102',
      applicantName: 'Mohammed Al-Falasi',
      serviceType: 'Golden Visa Processing',
      stage: 'MEDICAL_BIOMETRICS',
      clientId: individual.id,
      coordinatorId: admin.id,
    }
  });

  // Add dummy documents for public tracking
  await prisma.documentChecklist.create({
    data: {
      title: 'E-Visa / Entry Permit',
      status: 'APPROVED',
      caseFileId: case2.id,
    }
  });

  // 6. Government Portal Wallets
  console.log('Seeding Government Portal Wallets...');
  
  const tasheel = await prisma.portalWallet.create({
    data: {
      entityName: 'MOHRE / Tas-heel Prepaid Account',
      balance: 4850.00,
    }
  });

  const amer = await prisma.portalWallet.create({
    data: {
      entityName: 'Amer / GDRFA Dubai Smart Account',
      balance: 1450.00, // Trigger low balance < 2000
    }
  });

  const icp = await prisma.portalWallet.create({
    data: {
      entityName: 'ICP Smart Services',
      balance: 6200.00,
    }
  });

  const ded = await prisma.portalWallet.create({
    data: {
      entityName: 'Dubai Economy (DED)',
      balance: 3100.00,
    }
  });

  // 7. Seed Wallet Transactions
  console.log('Seeding Portal Deductions...');
  await prisma.portalTransaction.create({
    data: {
      walletId: tasheel.id,
      type: 'DEDUCTION',
      amount: 250.00,
      description: 'Offer Letter Submission',
      receiptRef: 'MB-1029384',
      balanceAfter: 4850.00 + 250.00, // Pre-deduction mockup math conceptually
      clientId: corp1.id,
      caseRef: case1.reference,
    }
  });

  await prisma.portalTransaction.create({
    data: {
      walletId: amer.id,
      type: 'DEDUCTION',
      amount: 1150.00,
      description: 'Visa Stamping Fee',
      receiptRef: 'GDRFA-XYZ999',
      balanceAfter: 1450.00 + 1150.00,
      clientId: corp2.id,
      caseRef: case2.reference,
    }
  });

  await prisma.portalTransaction.create({
    data: {
      walletId: icp.id,
      type: 'DEDUCTION',
      amount: 350.00,
      description: 'Emirates ID Typing',
      receiptRef: 'ICP-777888',
      balanceAfter: 6200.00 + 350.00,
      clientId: individual.id,
      caseRef: case3.reference,
    }
  });

  await prisma.portalTransaction.create({
    data: {
      walletId: amer.id,
      type: 'TOPUP',
      amount: 5000.00,
      description: 'Bank Transfer Top-up',
      receiptRef: 'TRN-1010101',
      balanceAfter: 2600.00, 
    }
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
