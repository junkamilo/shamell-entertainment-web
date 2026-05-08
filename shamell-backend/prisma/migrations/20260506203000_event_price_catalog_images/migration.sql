-- AlterTable
ALTER TABLE "events" ADD COLUMN "price" DECIMAL(12,2);

-- Gallery category for event catalog uploads (slug resolved by GalleryService unless EVENT_CATALOG_GALLERY_CATEGORY_ID is set)
INSERT INTO "gallery_categories" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Imágenes de catálogo (eventos)', 'event-catalog', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "gallery_categories" WHERE "slug" = 'event-catalog');
