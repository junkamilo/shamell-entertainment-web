import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createAdminStripeWebhooksServiceMock } from '../__mocks__/admin-stripe-webhooks.service.mock';
import {
  makeListQuery,
  makeWebhookEventDetail,
  makeWebhookEventRow,
} from '../__mocks__/admin-stripe-webhooks.fixtures';
import { AdminStripeWebhooksService } from '../services/admin-stripe-webhooks.service';
import { AdminStripeWebhooksController } from './admin-stripe-webhooks.controller';

describe('AdminStripeWebhooksController', () => {
  let controller: AdminStripeWebhooksController;
  const adminStripeWebhooksService = createAdminStripeWebhooksServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminStripeWebhooksController],
      providers: [
        {
          provide: AdminStripeWebhooksService,
          useValue: adminStripeWebhooksService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AdminStripeWebhooksController);
  });

  it('listEvents delegates to service', async () => {
    const payload = {
      items: [makeWebhookEventRow()],
      meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
    };
    adminStripeWebhooksService.listEvents.mockResolvedValue(payload);
    const query = makeListQuery();
    await expect(controller.listEvents(query)).resolves.toEqual(payload);
    expect(adminStripeWebhooksService.listEvents).toHaveBeenCalledWith(query);
  });

  it('getEvent delegates to getEventByStripeId', async () => {
    const detail = makeWebhookEventDetail();
    adminStripeWebhooksService.getEventByStripeId.mockResolvedValue(detail);
    await expect(controller.getEvent('evt_test_1')).resolves.toEqual(detail);
    expect(adminStripeWebhooksService.getEventByStripeId).toHaveBeenCalledWith(
      'evt_test_1',
    );
  });
});
