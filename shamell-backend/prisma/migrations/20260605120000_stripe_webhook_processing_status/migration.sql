CREATE TYPE "StripeWebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED');

ALTER TABLE "stripe_webhook_events"
ADD COLUMN "status" "StripeWebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED';

UPDATE "stripe_webhook_events"
SET "status" = 'PROCESSED'
WHERE "processedAt" IS NOT NULL;

UPDATE "stripe_webhook_events"
SET "status" = 'FAILED'
WHERE "processedAt" IS NULL AND "lastError" IS NOT NULL;

CREATE INDEX "stripe_webhook_events_status_createdAt_idx"
ON "stripe_webhook_events"("status", "createdAt");
