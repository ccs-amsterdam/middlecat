/*
  Warnings:

  - You are about to drop the column `context` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "context",
ADD COLUMN     "createdOn" TEXT;
