import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedActivity() {
    console.log('Seeding activity data...');

    // 1. Find some users
    const admin = await prisma.user.findFirst({ where: { role: 'SYSTEM_ADMINISTRATOR' } });
    const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' }, take: 3 });
    const hr = await prisma.user.findFirst({ where: { role: 'HR_OFFICER' } });

    if (!admin || employees.length === 0) {
        console.error('Missing users to seed activity. Run database seed first.');
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 2. Create some Leave Requests
    for (const emp of employees) {
        const leave = await prisma.leaveRequest.create({
            data: {
                userId: emp.id,
                supervisorId: admin.id,
                type: 'ANNUAL',
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 5)),
                reason: 'Vacation time',
                status: 'PENDING'
            }
        });

        await prisma.auditLog.create({
            data: {
                userId: emp.id,
                action: 'CREATE_LEAVE_REQUEST',
                targetTable: 'LeaveRequest',
                targetId: leave.id,
                details: `Applied for annual leave`,
                timestamp: new Date(Date.now() - Math.random() * 10000000)
            }
        });
    }

    // 3. Create some Sign-ins
    for (const emp of employees) {
        const attendance = await prisma.attendance.create({
            data: {
                userId: emp.id,
                type: 'sign-in',
                method: 'manual',
                timestamp: new Date()
            }
        });

        await prisma.auditLog.create({
            data: {
                userId: emp.id,
                action: 'SIGN_IN',
                targetTable: 'Attendance',
                targetId: attendance.id,
                details: `Signed in to office`,
                timestamp: new Date(Date.now() - Math.random() * 5000000)
            }
        });
    }

    // 4. Create some Holiday actions
    if (hr) {
        await prisma.auditLog.create({
            data: {
                userId: hr.id,
                action: 'AUTO_UPDATE_HOLIDAYS',
                targetTable: 'Holiday',
                targetId: 'SYSTEM',
                details: `Auto-updated holidays for 2026`,
                timestamp: new Date()
            }
        });
    }

    console.log('Activity seeding completed.');
}

seedActivity()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
