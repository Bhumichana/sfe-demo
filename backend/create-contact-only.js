const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createContact() {
  try {
    // Find the customer by code
    const customer = await prisma.customer.findUnique({
      where: { code: 'CUST-C004' },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

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

    console.log('✅ Created contact:');
    console.log('- Name:', contact.name);
    console.log('- Position:', contact.position);
    console.log('- Phone:', contact.phone);
    console.log('- For Customer:', customer.name);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createContact();
