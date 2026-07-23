-- Seed catalog row for admin private-class bookings (idempotent).
INSERT INTO service_types (id, name, "contactInquiryCode", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Private Class', 'PRIVATE_CLASS', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM service_types WHERE name = 'Private Class' OR "contactInquiryCode" = 'PRIVATE_CLASS'
);

INSERT INTO services (id, "serviceTypeId", description, items, price, "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  st.id,
  'Private one-on-one class booked from admin Book Class.',
  ARRAY[]::text[],
  NULL,
  true,
  NOW(),
  NOW()
FROM service_types st
WHERE (st.name = 'Private Class' OR st."contactInquiryCode" = 'PRIVATE_CLASS')
  AND NOT EXISTS (
    SELECT 1 FROM services s WHERE s."serviceTypeId" = st.id
  );
