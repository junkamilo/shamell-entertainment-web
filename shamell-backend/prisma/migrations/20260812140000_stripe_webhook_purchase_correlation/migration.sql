-- AlterTable
ALTER TABLE "stripe_webhook_events" ADD COLUMN "purchaseCorrelationId" TEXT;

-- CreateIndex
CREATE INDEX "stripe_webhook_events_purchaseCorrelationId_idx" ON "stripe_webhook_events"("purchaseCorrelationId");
