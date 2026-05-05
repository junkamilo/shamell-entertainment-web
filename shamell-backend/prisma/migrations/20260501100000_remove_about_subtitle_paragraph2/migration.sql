-- Merge paragraph2 into paragraph1 so existing content is not lost
UPDATE "about_content"
SET "paragraph1" = CASE
  WHEN TRIM(COALESCE("paragraph2", '')) <> ''
  THEN TRIM("paragraph1") || E'\n\n' || TRIM("paragraph2")
  ELSE "paragraph1"
END;

ALTER TABLE "about_content" DROP COLUMN "subtitle";
ALTER TABLE "about_content" DROP COLUMN "paragraph2";
