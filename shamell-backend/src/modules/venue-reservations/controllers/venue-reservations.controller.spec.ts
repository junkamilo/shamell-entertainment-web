import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { AdminJwtPayload } from '../../auth/decorators/current-admin.decorator';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { createVenueReservationsServiceMock } from '../__mocks__/venue-reservations.service.mock';
import { VenueReservationsService } from '../services/venue-reservations.service';
import { VenueReservationsController } from './venue-reservations.controller';

const RESERVATION_ID = '11111111-1111-4111-8111-111111111111';
const admin: AdminJwtPayload = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
};

describe('VenueReservationsController', () => {
  let controller: VenueReservationsController;
  const service = createVenueReservationsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [VenueReservationsController],
      providers: [{ provide: VenueReservationsService, useValue: service }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(VenueReservationsController);
  });

  it('getAvailability and getAdminAvailability trim query args', async () => {
    service.getAvailability.mockResolvedValue({ reservedLayoutItemIds: [] });
    service.getAdminAvailability.mockResolvedValue({
      reservedLayoutItemIds: [],
    });
    await expect(
      controller.getAvailability(' event-1 ', '  '),
    ).resolves.toEqual({ reservedLayoutItemIds: [] });
    expect(service.getAvailability).toHaveBeenCalledWith({
      upcomingEventId: 'event-1',
      upcomingEventSlug: undefined,
    });
    await expect(
      controller.getAdminAvailability(undefined, ' salsa '),
    ).resolves.toEqual({ reservedLayoutItemIds: [] });
    expect(service.getAdminAvailability).toHaveBeenCalledWith({
      upcomingEventId: undefined,
      upcomingEventSlug: 'salsa',
    });
  });

  it('list/cancel/admin checkout/cash delegate', async () => {
    service.listAdminReservations.mockResolvedValue({ items: [], total: 0 });
    service.cancelAdminReservation.mockResolvedValue({
      message: 'cancelled',
    });
    service.createAdminCheckoutSession.mockResolvedValue({
      payUrl: 'https://pay',
    });
    service.createAdminCashReservation.mockResolvedValue({
      reservationId: RESERVATION_ID,
    });

    await expect(controller.listAdmin({ page: 1 })).resolves.toEqual({
      items: [],
      total: 0,
    });
    await expect(controller.cancelAdmin(RESERVATION_ID)).resolves.toEqual({
      message: 'cancelled',
    });
    await expect(
      controller.createAdminCheckoutSession(admin, {
        upcomingEventId: 'evt-1',
        layoutItemIds: ['item-1'],
        customerName: 'A',
        customerEmail: 'a@b.com',
      } as never),
    ).resolves.toEqual({ payUrl: 'https://pay' });
    await expect(
      controller.createAdminCashReservation(admin, {
        upcomingEventId: 'evt-1',
        layoutItemIds: ['item-1'],
        customerName: 'A',
        customerEmail: 'a@b.com',
      } as never),
    ).resolves.toEqual({ reservationId: RESERVATION_ID });
  });

  it('public checkout/session-status/reconcile/pay validate and delegate', async () => {
    expect(() => controller.getSessionStatus('')).toThrow(BadRequestException);
    expect(() => controller.reconcileSession('')).toThrow(BadRequestException);
    expect(() => controller.resolvePayCheckout('')).toThrow(
      BadRequestException,
    );
    expect(() => controller.reconcilePaySession('')).toThrow(
      BadRequestException,
    );

    service.createCheckoutSession.mockResolvedValue({
      clientSecret: 'sec',
    });
    service.getSessionStatus.mockResolvedValue({ stripeStatus: 'open' });
    service.resolvePayCheckoutClientSecret.mockResolvedValue('sec_pay');

    await expect(
      controller.createCheckoutSession({
        upcomingEventId: 'evt-1',
        layoutItemIds: ['item-1'],
        customerName: 'A',
        customerEmail: 'a@b.com',
      } as never),
    ).resolves.toEqual({ clientSecret: 'sec' });
    await expect(controller.getSessionStatus('cs_1')).resolves.toEqual({
      stripeStatus: 'open',
    });
    await expect(controller.reconcileSession('cs_1')).resolves.toEqual({
      stripeStatus: 'open',
    });
    await expect(controller.resolvePayCheckout('token')).resolves.toEqual({
      clientSecret: 'sec_pay',
    });
    await expect(controller.reconcilePaySession('cs_1')).resolves.toEqual({
      stripeStatus: 'open',
    });
  });

  it('downloadConfirmationPdf validates token and streams PDF', async () => {
    await expect(controller.downloadConfirmationPdf('')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    service.getConfirmationPdfDownload.mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4'),
      filename: 'confirmation.pdf',
    });
    const file = await controller.downloadConfirmationPdf('token-1');
    expect(file).toBeDefined();
    expect(service.getConfirmationPdfDownload).toHaveBeenCalledWith('token-1');
  });

  it('resendConfirmation routes by customerNames / single id / rejects empty', async () => {
    service.resendAdminPaidConfirmationForCustomers.mockResolvedValue({
      sent: 2,
    });
    service.resendAdminPaidConfirmationEmail.mockResolvedValue({ sent: 1 });

    await expect(
      controller.resendConfirmation({
        customerNames: ['Ada', 'Bob'],
      }),
    ).resolves.toEqual({ sent: 2 });
    await expect(
      controller.resendConfirmation({
        reservationIds: [RESERVATION_ID],
      }),
    ).resolves.toEqual({ sent: 1 });
    expect(() => controller.resendConfirmation({ reservationIds: [] })).toThrow(
      BadRequestException,
    );
    expect(() =>
      controller.resendConfirmation({
        reservationIds: [RESERVATION_ID, RESERVATION_ID],
      }),
    ).toThrow(BadRequestException);
  });

  it('propagates service errors', async () => {
    service.createCheckoutSession.mockRejectedValue(
      new BadRequestException('On Coming Events is not published.'),
    );
    service.getSessionStatus.mockRejectedValue(
      new NotFoundException('Reservation not found.'),
    );
    await expect(
      controller.createCheckoutSession({
        upcomingEventId: 'evt-1',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.getSessionStatus('cs_x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('VenueReservationsController admin guard', () => {
  it('AdminJwtGuard deny blocks listAdmin at HTTP layer', async () => {
    const service = createVenueReservationsServiceMock();
    const moduleRef = await Test.createTestingModule({
      controllers: [VenueReservationsController],
      providers: [{ provide: VenueReservationsService, useValue: service }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({
        canActivate: () => {
          throw new ForbiddenException('Admin role is required.');
        },
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server).get('/venue-reservations/admin').expect(403);
    await app.close();
  });
});
