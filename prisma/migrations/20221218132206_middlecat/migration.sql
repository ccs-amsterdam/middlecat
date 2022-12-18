/*
  Warnings:

  - You are about to drop the column `secretUsed` on the `AmcatSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AmcatSession" DROP COLUMN "secretUsed",
ALTER COLUMN "secret" DROP NOT NULL,
ALTER COLUMN "secretExpires" DROP NOT NULL,
ALTER COLUMN "codeChallenge" DROP NOT NULL;
