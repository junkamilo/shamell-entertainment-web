-- AlterTable
ALTER TABLE "upcoming_event_activities"
ADD COLUMN "mediaUrl" VARCHAR(2048),
ADD COLUMN "mediaPublicId" VARCHAR(512),
ADD COLUMN "mediaType" "GalleryMediaType";
