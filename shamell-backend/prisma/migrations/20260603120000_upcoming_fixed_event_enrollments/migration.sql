-- CreateTable
CREATE TABLE "upcoming_fixed_event_enrollments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "UpcomingClassEnrollmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_fixed_event_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "upcoming_fixed_event_enrollments_stripeCheckoutSessionId_key" ON "upcoming_fixed_event_enrollments"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "upcoming_fixed_event_enrollments_eventId_status_idx" ON "upcoming_fixed_event_enrollments"("eventId", "status");

-- AddForeignKey
ALTER TABLE "upcoming_fixed_event_enrollments" ADD CONSTRAINT "upcoming_fixed_event_enrollments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
