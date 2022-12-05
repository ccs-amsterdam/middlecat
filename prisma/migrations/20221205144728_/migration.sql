/*
  Warnings:

  - You are about to drop the column `invalid` on the `AmcatRefreshToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AmcatRefreshToken" DROP COLUMN "invalid",
ADD COLUMN     "invalidSince" TIMESTAMP(3);
