const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCustomerGPS() {
  try {
    const customer = await prisma.customer.update({
      where: { id: 'bdb7fa70-54cd-4f61-9e16-410692a6c2d0' },
      data: {
        lat: '17.3585634',
        lng: '103.791326',
        address: '456 ถนนมิตรภาพ (ทดสอบระบบ)',
        district: 'เมือง',
        province: 'ขอนแก่น',
        postalCode: '40000'
      }
    });

    console.log('✅ Updated customer GPS:');
    console.log('- Name:', customer.name);
    console.log('- Code:', customer.code);
    console.log('- Lat:', customer.lat);
    console.log('- Lng:', customer.lng);
    console.log('- Address:', customer.address);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateCustomerGPS();
