/*
  Warnings:

  - Made the column `sessionId` on table `AmcatSession` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AmcatSession" DROP CONSTRAINT "AmcatSession_sessionId_fkey";

-- AlterTable
ALTER TABLE "AmcatSession" ALTER COLUMN "sessionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "AmcatSession" ADD CONSTRAINT "AmcatSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
