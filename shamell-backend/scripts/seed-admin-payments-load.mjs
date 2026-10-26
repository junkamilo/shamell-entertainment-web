/**
 * Seeds the local test PostgreSQL (docker-compose.test.yml, port 5434) with a
 * realistic payments volume for test/load/admin-payments-list.k6.js, and prints
 * a signed ADMIN JWT to pass to k6 as TOKEN.
 *
 * Refuses to run against anything but localhost:5434/shamell_test.
 *
 *   npm run test:db:up
 *   node scripts/seed-admin-payments-load.mjs [venueRows=20000] [fixedRows=10000]
 */
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5434/shamell_test";
const JWT_SECRET = process.env.JWT_SECRET?.trim() || "local-test-jwt-secret";
const VENUE_ROWS = Number(process.argv[2] ?? 20_000);
const FIXED_ROWS = Number(process.argv[3] ?? 10_000);
const STATUSES = ["PENDING_PAYMENT", "PAID", "EXPIRED", "CANCELLED"];
const ADMIN_EMAIL = "load-admin@shamell.test";

if (!DATABASE_URL.includes("localhost:5434/shamell_test")) {
  console.error("DATABASE_URL must point to localhost:5434/shamell_test");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  await client.query(
    `TRUNCATE "venue_seat_reservations", "upcoming_fixed_event_enrollments", "events", "event_types" CASCADE`,
  );

  const eventTypeId = randomUUID();
  const eventId = randomUUID();
  await client.query(
    `INSERT INTO "event_types" (id, name, "updatedAt") VALUES ($1, 'Load Fixed', now())`,
    [eventTypeId],
  );
  await client.query(
    `INSERT INTO "events" (id, "eventTypeId", description, slug, "updatedAt")
     VALUES ($1, $2, 'Admin payments load seed', 'load-fixed', now())`,
    [eventId, eventTypeId],
  );

  // generate_series keeps the insert server-side: tens of thousands of rows in one round trip.
  await client.query(
    `INSERT INTO "venue_seat_reservations"
       (id, kind, "layoutItemId", "eventDate", amount, status,
        "stripeCheckoutSessionId", "customerName", "customerEmail", "updatedAt")
     SELECT gen_random_uuid(),
            (CASE WHEN i % 2 = 0 THEN 'CATALOG_TABLE' ELSE 'STANDALONE_CHAIR' END)::"VenueSeatKind",
            'load-item-' || i,
            now() - (i % 90) * interval '1 day',
            50 + i % 200,
            ($2::text[])[1 + i % 4]::"VenueSeatReservationStatus",
            'cs_load_venue_' || i,
            'Load Customer ' || i,
            'customer' || i || '@load.test',
            now() - (i % 90) * interval '1 day' - i * interval '1 second'
     FROM generate_series(0, $1 - 1) AS i`,
    [VENUE_ROWS, STATUSES],
  );

  await client.query(
    `INSERT INTO "upcoming_fixed_event_enrollments"
       (id, "eventId", status, amount, "stripeCheckoutSessionId",
        "customerName", "customerEmail", "ticketNumber", "updatedAt")
     SELECT gen_random_uuid(), $2,
            ($3::text[])[1 + i % 4]::"UpcomingClassEnrollmentStatus",
            30 + i % 50,
            'cs_load_fixed_' || i,
            'Fixed Customer ' || i,
            'fixed' || i || '@load.test',
            i + 1,
            now() - (i % 90) * interval '1 day' - i * interval '1 second'
     FROM generate_series(0, $1 - 1) AS i`,
    [FIXED_ROWS, eventId, STATUSES],
  );

  const { rows } = await client.query(
    `INSERT INTO "users" (id, email, "fullName", role, "updatedAt")
     VALUES ($1, $2, 'Load Admin', 'ADMIN', now())
     ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'
     RETURNING id`,
    [randomUUID(), ADMIN_EMAIL],
  );
  await client.query("ANALYZE");

  const token = jwt.sign(
    { sub: rows[0].id, email: ADMIN_EMAIL, role: "ADMIN", permissions: [] },
    JWT_SECRET,
    { expiresIn: "2h" },
  );

  console.error(`Seeded ${VENUE_ROWS} venue + ${FIXED_ROWS} fixed payments.`);
  console.log(token);
} finally {
  await client.end();
}
