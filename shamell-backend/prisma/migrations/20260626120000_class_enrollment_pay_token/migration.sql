-- Allow cash / admin package enrollments without Stripe checkout session id
ALTER TABLE "upcoming_class_package_enrollments" ALTER COLUMN "stripeCheckoutSessionId" DROP NOT NULL;

-- Pay-by-link tokens for admin-initiated class checkouts
ALTER TABLE "upcoming_class_enrollments" ADD COLUMN "payTokenHash" TEXT;
ALTER TABLE "upcoming_class_package_enrollments" ADD COLUMN "payTokenHash" TEXT;

CREATE UNIQUE INDEX "upcoming_class_enrollments_payTokenHash_key"
  ON "upcoming_class_enrollments"("payTokenHash")
  WHERE "payTokenHash" IS NOT NULL;

CREATE UNIQUE INDEX "upcoming_class_package_enrollments_payTokenHash_key"
  ON "upcoming_class_package_enrollments"("payTokenHash")
  WHERE "payTokenHash" IS NOT NULL;
