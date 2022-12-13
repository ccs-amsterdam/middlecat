/*
  Warnings:

  - Added the required column `createdOn` to the `AmcatSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmcatSession" ADD COLUMN     "createdOn" TEXT NOT NULL;
