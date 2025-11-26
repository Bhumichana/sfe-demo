const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllData() {
  try {
    // Find SR user (sales1)
    const sr = await prisma.user.findUnique({
      where: { username: 'sales1' },
    });

    if (!sr) {
      throw new Error('SR user not found');
    }

    console.log('👤 SR User:', sr.fullName, `(${sr.id})`);
    console.log('');

    // Check Pre-Call Plans
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

    console.log(`📋 Pre-Call Plans: ${plans.length}`);
    plans.forEach(p => {
      console.log(`   - ${p.customer.name} (${p.customer.code}) - Status: ${p.status}`);
      console.log(`     GPS: ${p.customer.lat}, ${p.customer.lng}`);
    });
    console.log('');

    // Check Call Reports
    const reports = await prisma.callReport.findMany({
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

    console.log(`📝 Call Reports: ${reports.length}`);
    reports.forEach(r => {
      console.log(`   - ${r.customer.name} (${r.customer.code}) - Status: ${r.status}`);
      console.log(`     GPS: ${r.customer.lat}, ${r.customer.lng}`);
      console.log(`     Check-in: ${r.checkInTime || 'Not checked in'}`);
    });
    console.log('');

    // If there are any, delete them
    if (reports.length > 0) {
      const deleteResult = await prisma.callReport.deleteMany({
        where: { srId: sr.id },
      });
      console.log(`✅ Deleted ${deleteResult.count} call report(s)`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAllData();
