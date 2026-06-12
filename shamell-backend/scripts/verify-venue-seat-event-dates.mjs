/**
 * Verify venue seat reservation event dates after correction/resend.
 * Run: node scripts/verify-venue-seat-event-dates.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const TARGET_EMAILS = ['algonuevo250@gmail.com', 'rickteney@aol.com'];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const result = await pool.query(
    `
    SELECT
      vsr.id,
      vsr."customerName",
      vsr."customerEmail",
      vsr."eventDate",
      vsr."customerEmailSentAt",
      vsr."paidAt",
      uvc."reservationEventDate" AS config_event_date
    FROM venue_seat_reservations vsr
    LEFT JOIN upcoming_venue_configs uvc ON uvc."eventId" = vsr."upcomingEventId"
    WHERE vsr.status = 'PAID'
      AND (
        vsr."customerEmail" = ANY($1::text[])
        OR vsr."customerName" ILIKE 'Rick%'
        OR vsr."customerName" ILIKE 'Rossy%'
      )
    ORDER BY vsr."paidAt" DESC
    `,
    [TARGET_EMAILS],
  );

  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
