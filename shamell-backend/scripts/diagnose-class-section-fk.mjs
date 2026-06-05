/**
 * One-off diagnostic for upcoming_class_sessions.sectionId FK.
 * Run: node scripts/diagnose-class-section-fk.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const fk = await pool.query(`
    SELECT c.conname,
           c.confrelid::regclass AS references_table,
           c.conrelid::regclass AS from_table
    FROM pg_constraint c
    WHERE c.conname = 'upcoming_class_sessions_sectionId_fkey'
  `);
  console.log('FK constraint:', fk.rows);

  const orphans = await pool.query(`
    SELECT s.id, s."sectionId", s."eventId"
    FROM upcoming_class_sessions s
    LEFT JOIN reservation_event_class_sections sec ON sec.id = s."sectionId"
    WHERE s."sectionId" IS NOT NULL AND sec.id IS NULL
    LIMIT 20
  `);
  console.log('Orphan sessions (sectionId not in sections):', orphans.rowCount, orphans.rows);

  const dance = await pool.query(`
    SELECT e.id AS event_id,
           vc."reservationEventTemplateId" AS template_id,
           vc."reservationEventLabel"
    FROM upcoming_venue_configs vc
    JOIN events e ON e.id = vc."eventId"
    WHERE vc."reservationEventLabel" ILIKE '%Dance shamell%'
    LIMIT 5
  `);
  console.log('Dance shamell rows:', dance.rows);

  for (const row of dance.rows) {
    const sections = await pool.query(
      `SELECT id, weekday, "sortOrder", "isActive" FROM reservation_event_class_sections
       WHERE "templateId" = $1 ORDER BY weekday, "sortOrder"`,
      [row.template_id],
    );
    const sessions = await pool.query(
      `SELECT COUNT(*)::int AS n FROM upcoming_class_sessions WHERE "eventId" = $1`,
      [row.event_id],
    );
    console.log(`  template ${row.template_id}: sections=${sections.rowCount}, sessions=${sessions.rows[0]?.n}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
