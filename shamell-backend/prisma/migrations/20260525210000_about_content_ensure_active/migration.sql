-- Ensure saved About rows are visible on the public home (legacy rows may have isActive = false).
UPDATE "about_content" SET "isActive" = true WHERE "isActive" = false;
