-- About hero: distinguish image vs video for Cloudinary lifecycle and frontend playback.
ALTER TABLE "about_content" ADD COLUMN "heroMediaType" TEXT NOT NULL DEFAULT 'IMAGE';
