/*
  Warnings:

  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,shopifyId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,shopifyId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,shopifyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `shopifyId` on the `Customer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shopifyId` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `shopifyId` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_productId_fkey";

-- DropIndex
DROP INDEX "public"."Customer_shopifyId_key";

-- DropIndex
DROP INDEX "public"."Order_shopifyId_key";

-- DropIndex
DROP INDEX "public"."Product_shopifyId_key";

-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "shopifyId",
ADD COLUMN     "shopifyId" BIGINT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "productId",
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
DROP COLUMN "shopifyId",
ADD COLUMN     "shopifyId" BIGINT NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "price",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "shopifyId",
ADD COLUMN     "shopifyId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "Customer_tenantId_shopifyId_idx" ON "public"."Customer"("tenantId", "shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_shopifyId_key" ON "public"."Customer"("tenantId", "shopifyId");

-- CreateIndex
CREATE INDEX "Order_tenantId_shopifyId_idx" ON "public"."Order"("tenantId", "shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_shopifyId_key" ON "public"."Order"("tenantId", "shopifyId");

-- CreateIndex
CREATE INDEX "Product_tenantId_shopifyId_idx" ON "public"."Product"("tenantId", "shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_shopifyId_key" ON "public"."Product"("tenantId", "shopifyId");

-- CreateIndex
CREATE INDEX "User_tenantId_email_idx" ON "public"."User"("tenantId", "email");
