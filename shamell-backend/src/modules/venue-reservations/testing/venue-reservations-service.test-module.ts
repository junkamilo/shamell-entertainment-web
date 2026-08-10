import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createVenueReservationsRepositoryMock } from '../__mocks__/venue-reservations.repository.mock';
import { VenueReservationsRepository } from '../services/venue-reservations.repository';
import { VenueReservationsService } from '../services/venue-reservations.service';

export type VenueReservationsServiceTestHarness = {
  moduleRef: TestingModule;
  service: VenueReservationsService;
  repository: ReturnType<typeof createVenueReservationsRepositoryMock>;
  stripe: ReturnType<typeof createStripeServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
  config: { get: jest.Mock };
  floorLayout: {
    getPublicFloorLayoutForClient: jest.Mock;
    getActiveFloorLayoutId: jest.Mock;
  };
};

export async function createVenueReservationsServiceTestModule(): Promise<VenueReservationsServiceTestHarness> {
  const repository = createVenueReservationsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const floorLayout = {
    getPublicFloorLayoutForClient: jest.fn().mockResolvedValue({ items: [] }),
    getActiveFloorLayoutId: jest.fn().mockResolvedValue(null),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_test_created',
    client_secret: 'cs_test_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_test_created' });
  stripe.client.checkout.sessions.retrieve = jest.fn();

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

  return {
    moduleRef,
    service: moduleRef.get(VenueReservationsService),
    repository,
    stripe,
    mail,
    adminPaymentNotify,
    config,
    floorLayout,
  };
}
