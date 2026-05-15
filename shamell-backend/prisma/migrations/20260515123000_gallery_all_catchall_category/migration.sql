-- Catch-all album for uploads that should appear only under the public aggregate "All" filter
-- (slug must not be "all" — reserved in GET /gallery/photos).
INSERT INTO "gallery_categories" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'All', 'gallery-all', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "gallery_categories" WHERE "slug" = 'gallery-all'
);
