-- AlterTable
ALTER TABLE "AmcatSession" ADD COLUMN     "sessionId" TEXT;

-- AddForeignKey
ALTER TABLE "AmcatSession" ADD CONSTRAINT "AmcatSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
