/*
  Warnings:

  - Made the column `expires` on table `AmcatRefreshToken` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AmcatRefreshToken" ALTER COLUMN "expires" SET NOT NULL;
