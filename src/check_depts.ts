import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.department.count();
  const depts = await prisma.department.findMany();
  console.log('Department Count:', count);
  console.log('Departments:', JSON.stringify(depts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
