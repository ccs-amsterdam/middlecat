/*
  Warnings:

  - You are about to drop the column `created` on the `AmcatRefreshToken` table. All the data in the column will be lost.
  - Added the required column `refreshExpires` to the `AmcatSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmcatRefreshToken" DROP COLUMN "created";

-- AlterTable
ALTER TABLE "AmcatSession" ADD COLUMN     "refreshExpires" TIMESTAMP(3) NOT NULL;
