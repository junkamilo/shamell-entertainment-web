import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VenueReservationsService } from '../src/modules/venue-reservations/venue-reservations.service';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reservationIds = args
    .filter((arg) => arg.startsWith('--id='))
    .map((arg) => arg.slice('--id='.length).trim())
    .filter(Boolean);
  const customerNames = args.filter((arg) => !arg.startsWith('--'));

  if (reservationIds.length === 0 && customerNames.length === 0) {
    console.error(
      'Usage: npm run resend:venue-confirmation -- Rick Rossy',
    );
    console.error(
      '   or: npm run resend:venue-confirmation -- --id=<uuid> --id=<uuid>',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = app.get(VenueReservationsService);
    const results: Array<{
      customerName?: string;
      sent: boolean;
      reservationId?: string;
      customerEmail?: string;
      error?: string;
    }> = [];

    for (const reservationId of reservationIds) {
      try {
        const one = await service.resendAdminPaidConfirmationEmail(reservationId);
        results.push({
          customerName: one.customerName,
          sent: true,
          reservationId: one.reservationId,
          customerEmail: one.customerEmail,
        });
      } catch (err) {
        results.push({
          sent: false,
          reservationId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (customerNames.length > 0) {
      const batch =
        await service.resendAdminPaidConfirmationForCustomers(customerNames);
      results.push(...batch.results);
    }

    console.log(
      JSON.stringify({ message: 'Confirmation resend finished.', results }, null, 2),
    );

    if (results.some((row) => !row.sent)) {
      process.exit(1);
    }
  } finally {
    await app.close();
  }
}

void main();
