import { Prisma } from '@prisma/client';

export function peticionesSqlFragments() {
  const isOrphanContact = Prisma.sql`
    NOT EXISTS (
      SELECT 1
      FROM "bookings" b
      WHERE b."contactRequestId" = cr.id
    )
  `;
  const isShadowedBookingInquiryContact = Prisma.sql`
    NOT (
      (cr."inquiryDetails"->>'entrySource') IN ('contact_page', 'home_service_card', 'inquire_section')
      AND EXISTS (
        SELECT 1
        FROM "bookings" b
        WHERE LOWER(TRIM(b."guestEmail")) = LOWER(TRIM(cr.email))
          AND cr."eventDate" IS NOT NULL
          AND DATE(b."eventDate") = DATE(cr."eventDate")
          AND b."createdAt" BETWEEN cr."createdAt" - INTERVAL '30 minutes'
            AND cr."createdAt" + INTERVAL '30 minutes'
      )
    )
  `;
  const isConciergeContact = Prisma.sql`
    (
      (cr."inquiryDetails"->>'entrySource') = 'concierge_gate'
      OR LOWER(COALESCE(cr."subject", '')) LIKE '%concierge inquiry%'
    )
  `;
  const isPrivateClassBooking = Prisma.sql`
    (b."bookingDetails"->>'kind') = 'private_class'
  `;
  return {
    isOrphanContact,
    isShadowedBookingInquiryContact,
    isConciergeContact,
    isPrivateClassBooking,
  };
}
