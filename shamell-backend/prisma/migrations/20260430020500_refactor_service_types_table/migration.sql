-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_types_name_key" ON "service_types"("name");

-- AlterTable
ALTER TABLE "services" ADD COLUMN "serviceTypeId" TEXT;

-- Backfill service types from existing services
INSERT INTO "service_types" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT
    "id",
    COALESCE(NULLIF(TRIM("title"), ''), "type"::text),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services";

-- Link existing services to their backfilled service types
UPDATE "services"
SET "serviceTypeId" = "id"
WHERE "serviceTypeId" IS NULL;

-- Enforce relation and new constraints
ALTER TABLE "services" ALTER COLUMN "serviceTypeId" SET NOT NULL;
CREATE UNIQUE INDEX "services_serviceTypeId_key" ON "services"("serviceTypeId");
ALTER TABLE "services" ADD CONSTRAINT "services_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old shape
DROP INDEX IF EXISTS "services_type_key";
ALTER TABLE "services" DROP COLUMN "type";
ALTER TABLE "services" DROP COLUMN "title";
DROP TYPE IF EXISTS "ServiceType";
