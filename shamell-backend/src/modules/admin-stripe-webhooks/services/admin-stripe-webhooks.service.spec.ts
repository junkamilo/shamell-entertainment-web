import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createAdminStripeWebhooksRepositoryMock } from '../__mocks__/admin-stripe-webhooks.repository.mock';
import {
  makeListQuery,
  makePrismaWebhookEvent,
  makeRelatedSources,
  makeVenueReservationRelated,
} from '../__mocks__/admin-stripe-webhooks.fixtures';
import { AdminStripeWebhooksRepository } from './admin-stripe-webhooks.repository';
import { AdminStripeWebhooksService } from './admin-stripe-webhooks.service';

describe('AdminStripeWebhooksService', () => {
  let service: AdminStripeWebhooksService;
  const repository = createAdminStripeWebhooksRepositoryMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminStripeWebhooksService,
        { provide: AdminStripeWebhooksRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(AdminStripeWebhooksService);
  });

  it('listEvents rejects invalid from date', async () => {
    await expect(
      service.listEvents(makeListQuery({ from: 'not-a-date' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listEvents returns mapped items and meta', async () => {
    repository.countEvents.mockResolvedValue(1);
    repository.findEventsPage.mockResolvedValue([makePrismaWebhookEvent()]);

    const result = await service.listEvents(
      makeListQuery({ page: 1, limit: 10 }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].eventId).toBe('evt_test_1');
    expect(result.meta.totalItems).toBe(1);
  });

  it('getEventByStripeId throws 404 when missing', async () => {
    repository.findByStripeEventId.mockResolvedValue(null);
    await expect(
      service.getEventByStripeId('evt_missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getEventByStripeId returns detail with related payments', async () => {
    repository.findByStripeEventId.mockResolvedValue(makePrismaWebhookEvent());
    repository.findRelatedPaymentSources.mockResolvedValue(
      makeRelatedSources({
        venueReservation: makeVenueReservationRelated(),
      }),
    );

    const detail = await service.getEventByStripeId('evt_test_1');
    expect(detail.relatedPayments).toHaveLength(1);
    expect(detail.relatedPayments[0].kind).toBe('venue_seat_reservation');
  });
});
