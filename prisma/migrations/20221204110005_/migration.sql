/*
  Warnings:

  - You are about to drop the column `sessionId` on the `AmcatSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AmcatSession" DROP CONSTRAINT "AmcatSession_sessionId_fkey";

-- AlterTable
ALTER TABLE "AmcatSession" DROP COLUMN "sessionId";
