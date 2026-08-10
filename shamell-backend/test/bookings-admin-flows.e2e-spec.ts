import type { INestApplication } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createBookingsServiceMock } from '../src/modules/bookings/__mocks__/bookings.service.mock';
import {
  ADMIN_BOOKING_GUEST_DTO,
  BOOKING_DETAILS_WINDOW,
  OVERLAPPING_SLOT_EXISTING,
  makeBookingWithRelations,
  makeCancelledBooking,
  makeConfirmedBooking,
} from '../src/modules/bookings/__mocks__/bookings.fixtures';
import { createBookingsAdminServiceTestModule } from '../src/modules/bookings/testing/bookings-admin-service.test-module';
import { createBookingsHttpApp } from '../src/modules/bookings/testing/bookings-http-app';
import type {
  AdminBookingBody,
  ErrorBody,
} from '../src/modules/bookings/testing/bookings.test-types';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['repository'];
  adminPaymentNotify: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['adminPaymentNotify'];
};

async function createDeepBookingsAdminHttpApp(): Promise<DeepHarness> {
  const harness = await createBookingsAdminServiceTestModule();
  const bookingsService = {
    ...createBookingsServiceMock(),
    createAdminBooking: (adminUserId: string, dto: unknown) =>
      harness.service.createAdminBooking(
        adminUserId,
        dto as Parameters<typeof harness.service.createAdminBooking>[1],
      ),
    updateAdmin: (id: string, dto: unknown) =>
      harness.service.updateAdmin(
        id,
        dto as Parameters<typeof harness.service.updateAdmin>[1],
      ),
    findOneAdmin: (id: string) => harness.service.findOneAdmin(id),
    removeAdmin: (id: string, options?: { purgeContact?: boolean }) =>
      harness.service.removeAdmin(id, options),
    findAllAdmin: (query: unknown) =>
      harness.service.findAllAdmin(
        query as Parameters<typeof harness.service.findAllAdmin>[0],
      ),
    getPublicOccupiedByDate: (date: string) =>
      harness.service.getPublicOccupiedByDate(date),
  };

  const { app } = await createBookingsHttpApp({
    guardsAllow: true,
    bookingsService,
  });

  return {
    app,
    repository: harness.repository,
    adminPaymentNotify: harness.adminPaymentNotify,
  };
}

describe('Bookings admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let adminPaymentNotify: DeepHarness['adminPaymentNotify'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepBookingsAdminHttpApp();
    app = created.app;
    repository = created.repository;
    adminPaymentNotify = created.adminPaymentNotify;
  }

  it('POST /admin creates PENDING booking via real admin service', async () => {
    await boot();
    repository.createAdminBookingWithServices.mockResolvedValue(
      makeBookingWithRelations({ id: BOOKING_ID }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings/admin')
      .send(ADMIN_BOOKING_GUEST_DTO)
      .expect(201);

    const body = res.body as AdminBookingBody;
    expect(body.id).toBe(BOOKING_ID);
    expect(body.status).toBe(BookingStatus.PENDING);
    expect(repository.createAdminBookingWithServices).toHaveBeenCalled();
  });

  it('PATCH /admin/:id CONFIRMED via real admin service', async () => {
    await boot();
    repository.findBookingAdminById.mockResolvedValue(
      makeBookingWithRelations({ id: BOOKING_ID }),
    );
    repository.updateAdminBookingWithServices.mockResolvedValue(
      makeConfirmedBooking({ id: BOOKING_ID }),
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/admin/${BOOKING_ID}`)
      .send({ status: BookingStatus.CONFIRMED })
      .expect(200);

    const body = res.body as AdminBookingBody;
    expect(body.status).toBe(BookingStatus.CONFIRMED);
    expect(adminPaymentNotify.notifyPaymentOutcome).not.toHaveBeenCalled();
  });

  it('PATCH /admin/:id CANCELLED triggers cancel side effects', async () => {
    await boot();
    repository.findBookingAdminById.mockResolvedValue(
      makeBookingWithRelations({
        id: BOOKING_ID,
        contactRequestId: 'contact-1',
        quoteTotalAmount: 250 as never,
      }),
    );
    repository.updateAdminBookingWithServices.mockResolvedValue(
      makeCancelledBooking({
        id: BOOKING_ID,
        contactRequestId: 'contact-1',
        quoteTotalAmount: 250 as never,
      }),
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/admin/${BOOKING_ID}`)
      .send({ status: BookingStatus.CANCELLED })
      .expect(200);

    const body = res.body as AdminBookingBody;
    expect(body.status).toBe(BookingStatus.CANCELLED);
    expect(repository.cancelPendingBookingPayments).toHaveBeenCalledWith(
      BOOKING_ID,
    );
    expect(repository.updateContactRequestCancelled).toHaveBeenCalledWith(
      'contact-1',
    );
    expect(adminPaymentNotify.notifyPaymentOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'CANCELLED' }),
    );
  });

  it('POST /admin duplicate slot returns 400', async () => {
    await boot();
    repository.findActiveSlotsInDayRange.mockResolvedValue([
      OVERLAPPING_SLOT_EXISTING,
    ]);

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings/admin')
      .send({
        ...ADMIN_BOOKING_GUEST_DTO,
        bookingDetails: { ...BOOKING_DETAILS_WINDOW },
      })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
  });

  it('PATCH /admin/:id NotFound returns 404', async () => {
    await boot();
    repository.findBookingAdminById.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/admin/${BOOKING_ID}`)
      .send({ status: BookingStatus.CONFIRMED })
      .expect(404);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(404);
  });
});
