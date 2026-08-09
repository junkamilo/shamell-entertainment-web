import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createAdminPaymentsServiceMock } from '../__mocks__/admin-payments.service.mock';
import {
  makeAdminPaymentRow,
  makeListQuery,
  makePaymentDetail,
} from '../__mocks__/admin-payments.fixtures';
import { AdminPaymentsService } from '../services/admin-payments.service';
import { AdminPaymentsController } from './admin-payments.controller';

describe('AdminPaymentsController', () => {
  let controller: AdminPaymentsController;
  const adminPaymentsService = createAdminPaymentsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminPaymentsController],
      providers: [
        { provide: AdminPaymentsService, useValue: adminPaymentsService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AdminPaymentsController);
  });

  it('listPayments delegates to service', async () => {
    const payload = {
      items: [makeAdminPaymentRow()],
      meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
    };
    adminPaymentsService.listPayments.mockResolvedValue(payload);
    const query = makeListQuery();
    await expect(controller.listPayments(query)).resolves.toEqual(payload);
    expect(adminPaymentsService.listPayments).toHaveBeenCalledWith(query);
  });

  it('countBadge delegates to service', async () => {
    adminPaymentsService.countBadgeSince.mockResolvedValue({ count: 3 });
    await expect(controller.countBadge({ since: 100 })).resolves.toEqual({
      count: 3,
    });
  });

  it('getPaymentDetail validates flow', () => {
    expect(() => controller.getPaymentDetail('CLASS_PACKAGE', 'id-1')).toThrow(
      BadRequestException,
    );
  });

  it('getPaymentDetail requires id', () => {
    expect(() => controller.getPaymentDetail('BOOKING_QUOTE', '  ')).toThrow(
      BadRequestException,
    );
  });

  it('getPaymentDetail delegates for valid flow', async () => {
    const detail = makePaymentDetail();
    adminPaymentsService.getPaymentDetail.mockResolvedValue(detail);
    await expect(
      controller.getPaymentDetail('BOOKING_QUOTE', ' pay-1 '),
    ).resolves.toEqual(detail);
    expect(adminPaymentsService.getPaymentDetail).toHaveBeenCalledWith(
      'BOOKING_QUOTE',
      'pay-1',
    );
  });
});
