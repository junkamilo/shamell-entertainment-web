import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { createFloorLayoutServiceMock } from '../../floor-layout/__mocks__/floor-layout.service.mock';
import { createPrismaMock } from '../../../testing';
import { createAdminPaymentsRepositoryMock } from '../__mocks__/admin-payments.repository.mock';
import {
  makeBookingPaymentRow,
  makeListQuery,
  makeUnionKey,
  makeVenueRow,
} from '../__mocks__/admin-payments.fixtures';
import { AdminPaymentsRepository } from './admin-payments.repository';
import { AdminPaymentsService } from './admin-payments.service';

jest.mock(
  '../../venue-reservations/utils/venue-seat-display-label.util',
  () => ({
    resolveVenueSeatDisplayLabel: jest.fn().mockResolvedValue('Table A1'),
  }),
);

describe('AdminPaymentsService', () => {
  let service: AdminPaymentsService;
  const repository = createAdminPaymentsRepositoryMock();
  const prisma = createPrismaMock();
  const floorLayout = createFloorLayoutServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.defaultFlows.mockReturnValue([
      'BOOKING_QUOTE',
      'VENUE_SEAT',
      'CLASS_SESSION',
      'CLASS_PACKAGE',
      'CLASS_DAY_BUNDLE',
      'FIXED_TICKET',
    ]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminPaymentsService,
        { provide: AdminPaymentsRepository, useValue: repository },
        { provide: PrismaService, useValue: prisma },
        { provide: FloorLayoutService, useValue: floorLayout },
      ],
    }).compile();
    service = moduleRef.get(AdminPaymentsService);
  });

  it('listPayments returns empty meta when no union parts', async () => {
    repository.buildUnionParts.mockReturnValue([]);
    const result = await service.listPayments(makeListQuery());
    expect(result.items).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
  });

  it('listPayments rejects invalid from date', async () => {
    await expect(
      service.listPayments(makeListQuery({ from: 'not-a-date' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listPayments hydrates booking rows with pagination meta', async () => {
    repository.buildUnionParts.mockReturnValue([Prisma.sql`SELECT 1`]);
    repository.countUnion.mockResolvedValue(1);
    repository.listKeys.mockResolvedValue([
      makeUnionKey({ flow: 'BOOKING_QUOTE', id: 'bp-1' }),
    ]);
    repository.findBookingPaymentsByIds.mockResolvedValue([
      makeBookingPaymentRow(),
    ]);

    const result = await service.listPayments(
      makeListQuery({ page: 1, limit: 10 }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].flow).toBe('BOOKING_QUOTE');
    expect(result.meta.totalItems).toBe(1);
  });

  it('listPayments resolves venue seat labels via FloorLayout', async () => {
    repository.buildUnionParts.mockReturnValue([Prisma.sql`SELECT 1`]);
    repository.countUnion.mockResolvedValue(1);
    repository.listKeys.mockResolvedValue([
      makeUnionKey({ flow: 'VENUE_SEAT', id: 'vsr-1' }),
    ]);
    repository.findVenueReservationsByIds.mockResolvedValue([makeVenueRow()]);
    repository.findFloorLayoutIdForEvent.mockResolvedValue('layout-event');

    const result = await service.listPayments(makeListQuery());
    expect(result.items[0].contextLabel).toContain('Table A1');
    expect(repository.findFloorLayoutIdForEvent).toHaveBeenCalledWith(
      'event-1',
    );
  });

  it('getPaymentDetail throws 404 when missing', async () => {
    repository.findBookingPaymentById.mockResolvedValue(null);
    await expect(
      service.getPaymentDetail('BOOKING_QUOTE', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getPaymentDetail returns booking detail', async () => {
    repository.findBookingPaymentById.mockResolvedValue(
      makeBookingPaymentRow(),
    );
    const detail = await service.getPaymentDetail('BOOKING_QUOTE', 'bp-1');
    expect(detail.purchaseDetails.flow).toBe('BOOKING_QUOTE');
  });

  it('countBadgeSince returns 0 without since', async () => {
    await expect(service.countBadgeSince()).resolves.toEqual({ count: 0 });
    expect(repository.countBadgeSince).not.toHaveBeenCalled();
  });

  it('countBadgeSince delegates to repository', async () => {
    repository.countBadgeSince.mockResolvedValue(5);
    await expect(service.countBadgeSince(1_700_000_000_000)).resolves.toEqual({
      count: 5,
    });
  });
});
