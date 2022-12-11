/*
  Warnings:

  - Added the required column `label` to the `AmcatSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmcatSession" ADD COLUMN     "label" TEXT NOT NULL;
