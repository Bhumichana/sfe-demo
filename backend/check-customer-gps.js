const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomer() {
  try {
    const customer = await prisma.customer.findUnique({
      where: { code: 'CUST-C004' },
      include: {
        contacts: true,
      },
    });

    if (!customer) {
      console.log('❌ Customer not found');
      process.exit(1);
    }

    console.log('✅ Customer found:');
    console.log('- ID:', customer.id);
    console.log('- Code:', customer.code);
    console.log('- Name:', customer.name);
    console.log('- Lat:', customer.lat);
    console.log('- Lng:', customer.lng);
    console.log('- Address:', customer.address);
    console.log('\nContacts:');
    customer.contacts.forEach(c => {
      console.log(`  - ${c.name} (${c.position}) - ${c.phone}`);
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkCustomer();
