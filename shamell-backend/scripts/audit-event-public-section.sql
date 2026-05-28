-- Audit event sections (run: npx prisma db execute --file scripts/audit-event-public-section.sql)
SELECT "publicSection", COUNT(*)::int AS cnt
FROM "events"
GROUP BY "publicSection";

SELECT id, "publicSection", "isActive", "createdAt"
FROM "events"
ORDER BY "createdAt" DESC;
