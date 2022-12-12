/*
  Warnings:

  - You are about to drop the column `rotating` on the `AmcatRefreshToken` table. All the data in the column will be lost.
  - Added the required column `refreshRotate` to the `AmcatSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmcatRefreshToken" DROP COLUMN "rotating";

-- AlterTable
ALTER TABLE "AmcatSession" ADD COLUMN     "refreshRotate" BOOLEAN NOT NULL;
