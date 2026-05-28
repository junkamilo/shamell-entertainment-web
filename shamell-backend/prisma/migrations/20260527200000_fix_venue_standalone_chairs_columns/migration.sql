-- Align column names with Prisma schema (camelCase, same as venue_table_configs).

ALTER TABLE "venue_standalone_chairs" RENAME COLUMN "chair_name" TO "chairName";
ALTER TABLE "venue_standalone_chairs" RENAME COLUMN "unit_price" TO "unitPrice";
ALTER TABLE "venue_standalone_chairs" RENAME COLUMN "is_active" TO "isActive";
ALTER TABLE "venue_standalone_chairs" RENAME COLUMN "sort_order" TO "sortOrder";
ALTER TABLE "venue_standalone_chairs" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "venue_standalone_chairs" RENAME COLUMN "updated_at" TO "updatedAt";
