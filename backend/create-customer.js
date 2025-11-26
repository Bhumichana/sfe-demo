const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCustomer() {
  try {
    // Get SR user (sales1) to use as createdBy
    const sr = await prisma.user.findUnique({
      where: { username: 'sales1' },
    });

    if (!sr) {
      throw new Error('SR user not found');
    }

    // Get territory (use BKK1 for now)
    const territory = await prisma.territory.findFirst({
      where: { code: 'BKK1' },
    });

    if (!territory) {
      throw new Error('Territory not found');
    }

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        code: 'CUST-C004',
        name: 'ภักดี เภสัช',
        type: 'C',
        monthlyRevenue: 80000,
        address: 'Chang Ming, Phanna Nikhom District, Sakon Nakhon 47130',
        lat: '17.35863',
        lng: '103.79218',
        district: 'Phanna Nikhom',
        province: 'Sakon Nakhon',
        postalCode: '47130',
        phone: '042-123456',
        territoryId: territory.id,
        requiredVisitsPerMonth: 2,
        responseTimeHours: 24,
        isActive: true,
        createdBy: sr.id,
      },
    });

    console.log('✅ Created customer:');
    console.log('- ID:', customer.id);
    console.log('- Code:', customer.code);
    console.log('- Name:', customer.name);
    console.log('- Lat:', customer.lat);
    console.log('- Lng:', customer.lng);
    console.log('- Address:', customer.address);

    // Create contact for this customer
    const contact = await prisma.contact.create({
      data: {
        customerId: customer.id,
        name: 'นายภักดี มายอดมาก',
        position: 'เจ้าของร้าน',
        phone: '081-999-8888',
        email: 'phakdee@example.com',
        isPrimary: true,
      },
    });

    console.log('\n✅ Created contact:');
    console.log('- Name:', contact.name);
    console.log('- Position:', contact.position);
    console.log('- Phone:', contact.phone);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createCustomer();
