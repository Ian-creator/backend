"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const count = await prisma.department.count();
    const depts = await prisma.department.findMany();
    console.log('Department Count:', count);
    console.log('Departments:', JSON.stringify(depts, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
