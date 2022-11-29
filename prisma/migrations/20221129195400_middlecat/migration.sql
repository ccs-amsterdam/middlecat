/*
  Warnings:

  - You are about to drop the column `redirectUri` on the `AmcatSession` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `AmcatSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmcatSession" DROP COLUMN "redirectUri",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "AmcatSession" ADD CONSTRAINT "AmcatSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
