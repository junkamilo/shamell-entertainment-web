-- Booking services junction (multi-service packages)
CREATE TABLE "booking_services" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("bookingId","serviceId")
);

CREATE INDEX "booking_services_serviceId_idx" ON "booking_services"("serviceId");

ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill from booking_details.serviceIds JSON array, else primary service_id
INSERT INTO "booking_services" ("bookingId", "serviceId", "sortOrder")
SELECT DISTINCT ON ("bookingId", "serviceId")
  b.id AS "bookingId",
  svc_id AS "serviceId",
  (ord - 1)::int AS "sortOrder"
FROM "bookings" b
CROSS JOIN LATERAL (
  SELECT
    elem.value #>> '{}' AS svc_id,
    elem.ord::int AS ord
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(b."bookingDetails"->'serviceIds') = 'array'
        AND jsonb_array_length(b."bookingDetails"->'serviceIds') > 0
      THEN b."bookingDetails"->'serviceIds'
      ELSE jsonb_build_array(to_jsonb(b."serviceId"))
    END
  ) WITH ORDINALITY AS elem(value, ord)
) expanded
WHERE svc_id IS NOT NULL AND svc_id <> ''
ON CONFLICT ("bookingId", "serviceId") DO NOTHING;

-- Ensure at least primary service row when details had no serviceIds
INSERT INTO "booking_services" ("bookingId", "serviceId", "sortOrder")
SELECT b.id, b."serviceId", 0
FROM "bookings" b
WHERE NOT EXISTS (
  SELECT 1 FROM "booking_services" bs WHERE bs."bookingId" = b.id
)
ON CONFLICT ("bookingId", "serviceId") DO NOTHING;
