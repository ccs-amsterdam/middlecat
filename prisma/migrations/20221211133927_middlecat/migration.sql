-- AlterTable
ALTER TABLE "AmcatRefreshToken" ADD COLUMN     "rotating" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "AmcatSession" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'browser';
