-- One-time email OTP challenges (hashed codes only).
CREATE TABLE "email_verification_challenges" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "verifiedTokenHash" TEXT,
    "verifiedExpiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_challenges_verifiedTokenHash_key" ON "email_verification_challenges"("verifiedTokenHash");
CREATE INDEX "email_verification_challenges_email_purpose_idx" ON "email_verification_challenges"("email", "purpose");
