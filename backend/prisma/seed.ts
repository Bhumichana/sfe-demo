import { PrismaClient, UserRole, CustomerType, PlanStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE "users", "companies", "territories", "customers", "contacts", "activity_types", "pre_call_plans", "call_reports" RESTART IDENTITY CASCADE`;

  // Create demo company
  console.log('Creating company...');
  const company = await prisma.company.create({
    data: {
      name: 'Demo Pharma Company',
      logoUrl: 'https://via.placeholder.com/150',
      settings: {
        timezone: 'Asia/Bangkok',
        currency: 'THB',
      },
      storageUsedMb: 0,
      storageLimitMb: 102400,
    },
  });

  // Create territories
  console.log('Creating territories...');
  const territories = await Promise.all([
    prisma.territory.create({
      data: {
        code: 'BKK1',
        nameTh: 'กรุงเทพฯ เขตเหนือ',
        nameEn: 'Bangkok North',
        description: 'Northern Bangkok area',
        provinces: ['กรุงเทพมหานคร'],
      },
    }),
    prisma.territory.create({
      data: {
        code: 'BKK2',
        nameTh: 'กรุงเทพฯ เขตใต้',
        nameEn: 'Bangkok South',
        description: 'Southern Bangkok area',
        provinces: ['กรุงเทพมหานคร'],
      },
    }),
    prisma.territory.create({
      data: {
        code: 'BKK3',
        nameTh: 'กรุงเทพฯ เขตตะวันออก',
        nameEn: 'Bangkok East',
        description: 'Eastern Bangkok area',
        provinces: ['กรุงเทพมหานคร'],
      },
    }),
    prisma.territory.create({
      data: {
        code: 'BKK4',
        nameTh: 'กรุงเทพฯ เขตตะวันตก',
        nameEn: 'Bangkok West',
        description: 'Western Bangkok area',
        provinces: ['กรุงเทพมหานคร'],
      },
    }),
    prisma.territory.create({
      data: {
        code: 'CT1',
        nameTh: 'นนทบุรี + ปทุมธานี',
        nameEn: 'Nonthaburi + Pathum Thani',
        provinces: ['นนทบุรี', 'ปทุมธานี'],
      },
    }),
    prisma.territory.create({
      data: {
        code: 'CT2',
        nameTh: 'สมุทรปราการ + สมุทรสาคร',
        nameEn: 'Samut Prakan + Samut Sakhon',
        provinces: ['สมุทรปราการ', 'สมุทรสาคร'],
      },
    }),
    prisma.territory.create({
      data: {
        code: 'N1',
        nameTh: 'เชียงใหม่ + ลำพูน',
        nameEn: 'Chiang Mai + Lamphun',
        provinces: ['เชียงใหม่', 'ลำพูน'],
      },
    }),
  ]);

  // Hash password for demo users
  const demoPassword = await bcrypt.hash('demo1234', 10);

  // Create demo users
  console.log('Creating users...');

  // CEO
  const ceo = await prisma.user.create({
    data: {
      username: 'ceo',
      email: 'ceo@demo.com',
      passwordHash: demoPassword,
      fullName: 'วิชัย ซีอีโอ',
      phone: '081-000-0000',
      role: UserRole.CEO,
      companyId: company.id,
    },
  });

  // Sale Director
  const saleDirector = await prisma.user.create({
    data: {
      username: 'director',
      email: 'director@demo.com',
      passwordHash: demoPassword,
      fullName: 'สมศักดิ์ ผู้อำนวยการ',
      phone: '081-999-9999',
      role: UserRole.SD,
      managerId: ceo.id,
      companyId: company.id,
    },
  });

  // Sales Manager
  const salesManager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@demo.com',
      passwordHash: demoPassword,
      fullName: 'สมชาย ผู้จัดการ',
      phone: '081-111-1111',
      role: UserRole.SM,
      managerId: saleDirector.id,
      companyId: company.id,
      territoryId: territories[0].id,
    },
  });

  // Supervisor
  const supervisor = await prisma.user.create({
    data: {
      username: 'supervisor',
      email: 'supervisor@demo.com',
      passwordHash: demoPassword,
      fullName: 'สมหญิง หัวหน้างาน',
      phone: '081-555-5555',
      role: UserRole.SUP,
      managerId: salesManager.id,
      companyId: company.id,
      territoryId: territories[0].id,
    },
  });

  // Sales Rep 1 (SR)
  const sr1 = await prisma.user.create({
    data: {
      username: 'sales1',
      email: 'sales1@demo.com',
      passwordHash: demoPassword,
      fullName: 'สวัสดี คุณสมชาย',
      phone: '082-222-2222',
      role: UserRole.SR,
      managerId: supervisor.id,
      companyId: company.id,
      territoryId: territories[0].id,
    },
  });

  // Sales Rep 2
  const sr2 = await prisma.user.create({
    data: {
      username: 'sales2',
      email: 'sales2@demo.com',
      passwordHash: demoPassword,
      fullName: 'ชัยชนะ พนักงานขาย',
      phone: '083-333-3333',
      role: UserRole.SR,
      managerId: supervisor.id,
      companyId: company.id,
      territoryId: territories[1].id,
    },
  });

  // Product Manager
  const pm = await prisma.user.create({
    data: {
      username: 'pm',
      email: 'pm@demo.com',
      passwordHash: demoPassword,
      fullName: 'วิทยา ผลิตภัณฑ์',
      phone: '084-444-4444',
      role: UserRole.PM,
      managerId: saleDirector.id,
      companyId: company.id,
    },
  });

  // Marketing Manager
  const mm = await prisma.user.create({
    data: {
      username: 'mm',
      email: 'mm@demo.com',
      passwordHash: demoPassword,
      fullName: 'สุดา การตลาด',
      phone: '084-666-6666',
      role: UserRole.MM,
      managerId: saleDirector.id,
      companyId: company.id,
    },
  });

  // Create activity types
  console.log('Creating activity types...');
  const activities = [
    { code: 'DETAIL', nameTh: 'Detail product', nameEn: 'Detail product' },
    { code: 'POP', nameTh: 'วาง POP/POSM', nameEn: 'Install POP/POSM', requiresPhoto: true },
    { code: 'PROPOSE', nameTh: 'เสนอสินค้าเข้า', nameEn: 'Propose product listing' },
    { code: 'PRESENT', nameTh: 'Present product', nameEn: 'Present product' },
    { code: 'SAMPLING', nameTh: 'Sampling', nameEn: 'Sampling' },
    { code: 'PROBLEM', nameTh: 'Handle customer problems', nameEn: 'Handle customer problems' },
    { code: 'ORDER', nameTh: 'รับ sales order', nameEn: 'Take sales order' },
    { code: 'STOCK', nameTh: 'เช็ค stock', nameEn: 'Check stock' },
    { code: 'SPEC', nameTh: 'ติดตาม product spec', nameEn: 'Follow up product spec' },
    { code: 'BILLING', nameTh: 'วางบิล/ตามบิล/เก็บเงิน', nameEn: 'Billing & collection' },
    { code: 'MEAL', nameTh: 'Business meal', nameEn: 'Business meal' },
    { code: 'BOOTH', nameTh: 'ออก booth', nameEn: 'Booth event' },
    { code: 'BUDGET', nameTh: 'ประมาณงบการ engage', nameEn: 'Budget engagement planning' },
  ];

  await Promise.all(
    activities.map((activity, index) =>
      prisma.activityType.create({
        data: {
          ...activity,
          sortOrder: index + 1,
        },
      }),
    ),
  );

  // Create demo customers
  console.log('Creating customers...');

  // Type A - VIP customers
  const customerA1 = await prisma.customer.create({
    data: {
      code: 'CUST-A001',
      name: 'โรงพยาบาลกรุงเทพ',
      type: CustomerType.A,
      monthlyRevenue: 800000,
      address: '2 ซอยศูนย์วิจัย 7 บางกะปิ',
      lat: 13.7563,
      lng: 100.5018,
      district: 'ห้วยขวาง',
      province: 'กรุงเทพมหานคร',
      postalCode: '10310',
      phone: '02-310-3000',
      territoryId: territories[0].id,
      requiredVisitsPerMonth: 12,
      responseTimeHours: 2,
      createdBy: sr1.id,
    },
  });

  const customerA2 = await prisma.customer.create({
    data: {
      code: 'CUST-A002',
      name: 'โรงพยาบาลบำรุงราษฎร์',
      type: CustomerType.A,
      monthlyRevenue: 650000,
      address: '33 ซอยสุขุมวิท 3 วัฒนา',
      lat: 13.7389,
      lng: 100.5599,
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      phone: '02-011-2000',
      territoryId: territories[0].id,
      requiredVisitsPerMonth: 12,
      responseTimeHours: 2,
      createdBy: sr1.id,
    },
  });

  // Type B - Important customers
  const customerB1 = await prisma.customer.create({
    data: {
      code: 'CUST-B001',
      name: 'โรงพยาบาลเปาโล เมโมเรียล',
      type: CustomerType.B,
      monthlyRevenue: 350000,
      address: '670/1 ถนนพหลโยธิน',
      lat: 13.8143,
      lng: 100.5589,
      district: 'สามเสนใน',
      province: 'กรุงเทพมหานคร',
      postalCode: '10400',
      phone: '02-940-6600',
      territoryId: territories[1].id,
      requiredVisitsPerMonth: 6,
      responseTimeHours: 4,
      createdBy: sr2.id,
    },
  });

  const customerB2 = await prisma.customer.create({
    data: {
      code: 'CUST-B002',
      name: 'คลินิกหมอชำนาญ',
      type: CustomerType.B,
      monthlyRevenue: 200000,
      address: '45/12 ถนนรามคำแหง',
      lat: 13.7563,
      lng: 100.6072,
      district: 'หัวหมาก',
      province: 'กรุงเทพมหานคร',
      postalCode: '10240',
      phone: '02-318-5555',
      territoryId: territories[2].id,
      requiredVisitsPerMonth: 5,
      responseTimeHours: 4,
      createdBy: sr1.id,
    },
  });

  // Type C - Standard customers
  const customerC1 = await prisma.customer.create({
    data: {
      code: 'CUST-C001',
      name: 'ร้านยาสุขภาพดี',
      type: CustomerType.C,
      monthlyRevenue: 75000,
      address: '123 ถนนพระราม 4',
      lat: 13.7307,
      lng: 100.5418,
      district: 'ปทุมวัน',
      province: 'กรุงเทพมหานคร',
      postalCode: '10330',
      phone: '02-255-4444',
      territoryId: territories[0].id,
      requiredVisitsPerMonth: 2,
      responseTimeHours: 24,
      createdBy: sr1.id,
    },
  });

  const customerC2 = await prisma.customer.create({
    data: {
      code: 'CUST-C002',
      name: 'คลินิกหมอครอบครัว',
      type: CustomerType.C,
      monthlyRevenue: 50000,
      address: '88/99 ซอยอ่อนนุช 17',
      lat: 13.7053,
      lng: 100.6093,
      district: 'สวนหลวง',
      province: 'กรุงเทพมหานคร',
      postalCode: '10250',
      phone: '02-349-8888',
      territoryId: territories[2].id,
      requiredVisitsPerMonth: 1,
      responseTimeHours: 24,
      createdBy: sr1.id,
    },
  });

  // Create contacts for customers
  console.log('Creating contacts...');
  await prisma.contact.createMany({
    data: [
      {
        customerId: customerA1.id,
        name: 'ดร.สมศักดิ์ แพทย์ใหญ่',
        position: 'ผู้อำนวยการ',
        phone: '081-555-1111',
        email: 'somsak@hospital.com',
        isPrimary: true,
      },
      {
        customerId: customerA1.id,
        name: 'คุณสมหญิง จัดซื้อ',
        position: 'หัวหน้าจัดซื้อ',
        phone: '082-555-2222',
        email: 'purchasing@hospital.com',
        isPrimary: false,
      },
      {
        customerId: customerA2.id,
        name: 'ภก.ชัยณรงค์ ภัทรกุล',
        position: 'เภสัชกร',
        phone: '083-666-3333',
        email: 'chainrong@bumrungrad.com',
        isPrimary: true,
      },
      {
        customerId: customerB1.id,
        name: 'คุณวิไล สุขสม',
        position: 'ผู้จัดการฝ่ายจัดซื้อ',
        phone: '084-777-4444',
        email: 'wilai@paolo.com',
        isPrimary: true,
      },
      {
        customerId: customerB2.id,
        name: 'ดร.ชำนาญ รักษาคน',
        position: 'แพทย์เจ้าของคลินิก',
        phone: '085-888-5555',
        email: 'dr.chamnan@clinic.com',
        isPrimary: true,
      },
      {
        customerId: customerC1.id,
        name: 'คุณสุขใจ ขายยา',
        position: 'เจ้าของร้าน',
        phone: '086-999-6666',
        email: 'sukchai@pharmacy.com',
        isPrimary: true,
      },
      {
        customerId: customerC2.id,
        name: 'ดร.ครอบครัว ดูแล',
        position: 'แพทย์',
        phone: '087-111-7777',
        email: 'family@clinic.com',
        isPrimary: true,
      },
    ],
  });

  console.log('✅ Seed completed!');
  console.log('');
  console.log('🔐 Demo Users:');
  console.log('  CEO:            ceo        / demo1234');
  console.log('  Sale Director:  director   / demo1234');
  console.log('  Sales Manager:  manager    / demo1234');
  console.log('  Supervisor:     supervisor / demo1234');
  console.log('  Sales Rep 1:    sales1     / demo1234');
  console.log('  Sales Rep 2:    sales2     / demo1234');
  console.log('  Product Mgr:    pm         / demo1234');
  console.log('  Marketing Mgr:  mm         / demo1234');
  console.log('');
  console.log('📊 Created:');
  console.log(`  - 1 Company`);
  console.log(`  - 7 Territories`);
  console.log(`  - 8 Users (CEO, SD, SM, MM, PM, SUP, 2xSR)`);
  console.log(`  - 13 Activity Types`);
  console.log(`  - 6 Customers (2xA, 2xB, 2xC)`);
  console.log(`  - 7 Contacts`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
