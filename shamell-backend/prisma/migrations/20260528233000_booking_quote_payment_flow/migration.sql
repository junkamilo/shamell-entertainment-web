CREATE TYPE "BookingQuotePaymentModel" AS ENUM ('FULL', 'DEPOSIT');
CREATE TYPE "BookingQuoteStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "BookingPaymentStage" AS ENUM ('FULL', 'DEPOSIT', 'BALANCE');
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

ALTER TABLE "bookings"
ADD COLUMN "quoteModel" "BookingQuotePaymentModel",
ADD COLUMN "quoteTotalAmount" DECIMAL(12,2),
ADD COLUMN "quoteDepositAmount" DECIMAL(12,2),
ADD COLUMN "quoteBalanceAmount" DECIMAL(12,2),
ADD COLUMN "quoteCurrency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN "quoteSentAt" TIMESTAMP(3),
ADD COLUMN "quoteAcceptedAt" TIMESTAMP(3),
ADD COLUMN "quoteRejectedAt" TIMESTAMP(3),
ADD COLUMN "depositPaidAt" TIMESTAMP(3),
ADD COLUMN "balancePaidAt" TIMESTAMP(3);

CREATE TABLE "booking_quotes" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status" "BookingQuoteStatus" NOT NULL DEFAULT 'SENT',
  "paymentModel" "BookingQuotePaymentModel" NOT NULL,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "depositAmount" DECIMAL(12,2),
  "balanceAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "tokenHash" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "respondedAt" TIMESTAMP(3),
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "booking_quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_payments" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "stage" "BookingPaymentStage" NOT NULL,
  "expectedAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" "BookingPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "stripeCheckoutSessionId" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_payments_stripeCheckoutSessionId_key"
ON "booking_payments"("stripeCheckoutSessionId");

CREATE INDEX "booking_quotes_bookingId_status_idx"
ON "booking_quotes"("bookingId", "status");
CREATE INDEX "booking_quotes_tokenExpiresAt_idx"
ON "booking_quotes"("tokenExpiresAt");
CREATE INDEX "booking_payments_bookingId_stage_status_idx"
ON "booking_payments"("bookingId", "stage", "status");
CREATE INDEX "booking_payments_quoteId_stage_idx"
ON "booking_payments"("quoteId", "stage");

ALTER TABLE "booking_quotes"
ADD CONSTRAINT "booking_quotes_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_payments"
ADD CONSTRAINT "booking_payments_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_payments"
ADD CONSTRAINT "booking_payments_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "booking_quotes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
