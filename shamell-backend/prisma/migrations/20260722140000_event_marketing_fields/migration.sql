-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "marketingFeatures" JSONB;
