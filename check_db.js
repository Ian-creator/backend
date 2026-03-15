
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const userCount = await prisma.user.count();
        console.log('Total users:', userCount);
        const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
        console.log('Admin user exists:', !!admin);
    } catch (error) {
        console.error('Database check error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
