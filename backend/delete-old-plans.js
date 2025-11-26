const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOldPlans() {
  try {
    // Find SR user (sales1)
    const sr = await prisma.user.findUnique({
      where: { username: 'sales1' },
    });

    if (!sr) {
      throw new Error('SR user not found');
    }

    // Find all pre-call plans for this SR
    const plans = await prisma.preCallPlan.findMany({
      where: { srId: sr.id },
      include: {
        customer: {
          select: {
            code: true,
            name: true,
            lat: true,
            lng: true,
          },
        },
      },
    });

    console.log(`Found ${plans.length} pre-call plan(s) for SR: ${sr.fullName}`);
    console.log('');

    for (const plan of plans) {
      console.log(`📋 Plan ID: ${plan.id}`);
      console.log(`   Customer: ${plan.customer.name} (${plan.customer.code})`);
      console.log(`   GPS: ${plan.customer.lat}, ${plan.customer.lng}`);
      console.log(`   Status: ${plan.status}`);
      console.log(`   Date: ${plan.visitDate}`);
      console.log('');
    }

    // Delete all plans for this SR
    const result = await prisma.preCallPlan.deleteMany({
      where: { srId: sr.id },
    });

    console.log(`✅ Deleted ${result.count} pre-call plan(s)`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

deleteOldPlans();
