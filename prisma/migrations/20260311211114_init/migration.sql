/*
  Warnings:

  - The values [DEVELOPER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SYSTEM_ADMINISTRATOR', 'IT_MANAGER', 'EXECUTIVE', 'HR_OFFICER', 'SUPERVISOR', 'EMPLOYEE', 'ASSISTANT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;
