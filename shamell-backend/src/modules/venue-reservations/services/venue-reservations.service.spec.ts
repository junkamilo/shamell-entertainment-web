import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { createVenueReservationsRepositoryMock } from '../__mocks__/venue-reservations.repository.mock';
import { VenueReservationsRepository } from './venue-reservations.repository';
import { VenueReservationsService } from './venue-reservations.service';

describe('VenueReservationsService', () => {
  let service: VenueReservationsService;
  const repository = createVenueReservationsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = { sendTransactional: jest.fn().mockResolvedValue({ ok: true }) };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };
  const config = { get: jest.fn() };
  const floorLayout = {
    getPublicFloorLayoutForClient: jest.fn().mockResolvedValue({ items: [] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue({
      venueLayoutClientSettings: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      event: { findFirst: jest.fn().mockResolvedValue(null) },
      upcomingVenueConfig: { findUnique: jest.fn() },
      venueSeatReservation: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        VenueReservationsService,
        { provide: VenueReservationsRepository, useValue: repository },
        { provide: ConfigService, useValue: config },
        { provide: MailService, useValue: mail },
        { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
        { provide: StripeService, useValue: stripe },
        { provide: FloorLayoutService, useValue: floorLayout },
      ],
    }).compile();
    service = moduleRef.get(VenueReservationsService);
  });

  it('processStripeWebhookEvent ignores non venue_seat flows', async () => {
    await expect(
      service.processStripeWebhookEvent({
        id: 'evt_1',
        type: 'checkout.session.completed',
        livemode: false,
        data: {
          object: {
            id: 'cs_1',
            metadata: { flow: 'booking_quote' },
          },
        },
      }),
    ).resolves.toEqual({ received: true, handled: false });
  });
});
