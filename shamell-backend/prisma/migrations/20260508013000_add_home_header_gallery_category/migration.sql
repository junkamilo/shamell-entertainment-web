INSERT INTO "gallery_categories" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Header Principal', 'home-header', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "gallery_categories" WHERE "slug" = 'home-header'
);
