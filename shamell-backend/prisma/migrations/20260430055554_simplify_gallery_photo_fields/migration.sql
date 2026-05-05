/*
  Warnings:

  - You are about to drop the column `altText` on the `gallery_photos` table. All the data in the column will be lost.
  - You are about to drop the column `moduleType` on the `gallery_photos` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `gallery_photos` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "gallery_photos_categoryId_isActive_sortOrder_idx";

-- DropIndex
DROP INDEX "gallery_photos_moduleType_isActive_idx";

-- AlterTable
ALTER TABLE "gallery_photos" DROP COLUMN "altText",
DROP COLUMN "moduleType",
DROP COLUMN "sortOrder";

-- DropEnum
DROP TYPE "GalleryModuleType";

-- CreateIndex
CREATE INDEX "gallery_photos_categoryId_isActive_idx" ON "gallery_photos"("categoryId", "isActive");
