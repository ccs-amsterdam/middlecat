/*
  Warnings:

  - You are about to drop the column `expires` on the `AmcatRefreshToken` table. All the data in the column will be lost.
  - Added the required column `created` to the `AmcatRefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmcatRefreshToken" DROP COLUMN "expires",
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL;
