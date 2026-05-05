-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "gallery_photos" ADD COLUMN     "mediaType" "GalleryMediaType" NOT NULL DEFAULT 'IMAGE';
