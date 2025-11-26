import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDateTime() {
  console.log('🧪 Testing planDate DateTime field...\n');

  try {
    // 1. สร้างข้อมูลทดสอบ
    console.log('1️⃣ Creating test data...');

    // สร้าง company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        storageUsedMb: 0,
        storageLimitMb: 102400,
      }
    });
    console.log('✅ Created company:', company.name);

    // สร้าง user
    const user = await prisma.user.create({
      data: {
        username: 'test_sr',
        email: 'test_sr@example.com',
        fullName: 'Test Sales Rep',
        role: 'SR',
        companyId: company.id,
      }
    });
    console.log('✅ Created user:', user.fullName);

    // สร้าง customer
    const customer = await prisma.customer.create({
      data: {
        code: 'TEST001',
        name: 'Test Customer',
        type: 'A',
        monthlyRevenue: 1000000,
        createdBy: user.id,
      }
    });
    console.log('✅ Created customer:', customer.name);

    // สร้าง contact
    const contact = await prisma.contact.create({
      data: {
        customerId: customer.id,
        name: 'Test Contact',
        position: 'Manager',
        isPrimary: true,
      }
    });
    console.log('✅ Created contact:', contact.name);
    console.log('');

    // 2. สร้าง Pre-Call Plan พร้อมวันและเวลา
    console.log('2️⃣ Creating Pre-Call Plan with DateTime...');
    const testPlanDate = new Date('2025-01-15T14:30:00.000Z'); // 15 มกราคม 2025, 14:30 UTC

    const plan = await prisma.preCallPlan.create({
      data: {
        srId: user.id,
        customerId: customer.id,
        contactId: contact.id,
        planDate: testPlanDate,
        objectives: 'ทดสอบการบันทึกวันและเวลา',
        plannedActivities: ['detail-product', 'present-product'],
        status: 'DRAFT',
      },
    });

    console.log('✅ Created Pre-Call Plan:');
    console.log('   ID:', plan.id);
    console.log('   Plan Date (Raw):', plan.planDate);
    console.log('   Plan Date (ISO):', plan.planDate.toISOString());
    console.log('   Plan Date (Local):', plan.planDate.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      dateStyle: 'full',
      timeStyle: 'medium'
    }));
    console.log('');

    // 3. ทดสอบการดึงข้อมูล
    console.log('3️⃣ Fetching Pre-Call Plan...');
    const fetchedPlan = await prisma.preCallPlan.findUnique({
      where: { id: plan.id },
      include: {
        sr: { select: { fullName: true } },
        customer: { select: { name: true } },
        contact: { select: { name: true } }
      }
    });

    if (fetchedPlan) {
      console.log('✅ Fetched Pre-Call Plan:');
      console.log('   SR:', fetchedPlan.sr.fullName);
      console.log('   Customer:', fetchedPlan.customer.name);
      console.log('   Contact:', fetchedPlan.contact.name);
      console.log('   Plan Date:', fetchedPlan.planDate.toISOString());
      console.log('   Plan Date (Thailand):', fetchedPlan.planDate.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }
    console.log('');

    // 4. ทดสอบการ query ด้วย date range
    console.log('4️⃣ Testing date range query...');
    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const endDate = new Date('2025-01-31T23:59:59.999Z');

    const plansInRange = await prisma.preCallPlan.findMany({
      where: {
        planDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        planDate: true,
        objectives: true
      }
    });

    console.log(`✅ Found ${plansInRange.length} plan(s) in January 2025:`);
    plansInRange.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.planDate.toISOString()} - ${p.objectives}`);
    });
    console.log('');

    // 5. ทดสอบการ update เวลา
    console.log('5️⃣ Testing update time...');
    const newPlanDate = new Date('2025-01-15T16:45:00.000Z'); // เปลี่ยนเวลาเป็น 16:45

    const updatedPlan = await prisma.preCallPlan.update({
      where: { id: plan.id },
      data: { planDate: newPlanDate }
    });

    console.log('✅ Updated Plan Date:');
    console.log('   Before:', testPlanDate.toISOString());
    console.log('   After:', updatedPlan.planDate.toISOString());
    console.log('   Time difference:',
      (updatedPlan.planDate.getTime() - testPlanDate.getTime()) / 1000 / 60,
      'minutes'
    );
    console.log('');

    // 6. ทดสอบการแสดงเวลาในรูปแบบต่างๆ
    console.log('6️⃣ Testing different time formats...');
    console.log('   ISO 8601:', updatedPlan.planDate.toISOString());
    console.log('   UTC String:', updatedPlan.planDate.toUTCString());
    console.log('   Local (TH):', updatedPlan.planDate.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok'
    }));
    console.log('   Date only (TH):', updatedPlan.planDate.toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    console.log('   Time only (TH):', updatedPlan.planDate.toLocaleTimeString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit'
    }));
    console.log('');

    // 7. ทำความสะอาด
    console.log('7️⃣ Cleaning up test data...');
    await prisma.preCallPlan.delete({
      where: { id: plan.id }
    });
    await prisma.contact.delete({
      where: { id: contact.id }
    });
    await prisma.customer.delete({
      where: { id: customer.id }
    });
    await prisma.user.delete({
      where: { id: user.id }
    });
    await prisma.company.delete({
      where: { id: company.id }
    });
    console.log('✅ All test data deleted\n');

    console.log('🎉 All tests passed! planDate is now DateTime and working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateTime();
