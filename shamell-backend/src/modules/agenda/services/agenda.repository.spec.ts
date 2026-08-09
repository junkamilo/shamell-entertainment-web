import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { bookingEligibleEventTypesWhere } from '../../events/utils/booking-inquiry-catalog.util';
import { AgendaRepository } from './agenda.repository';

describe('AgendaRepository', () => {
  let repository: AgendaRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AgendaRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(AgendaRepository);
  });

  it('findActiveServicesForCatalog queries active services', async () => {
    prisma.service.findMany.mockResolvedValue([]);
    await repository.findActiveServicesForCatalog();
    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        serviceType: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('findBookingEligibleEventTypes uses booking-eligible where', async () => {
    prisma.eventType.findMany.mockResolvedValue([]);
    await repository.findBookingEligibleEventTypes();
    expect(prisma.eventType.findMany).toHaveBeenCalledWith({
      where: bookingEligibleEventTypesWhere(),
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });

  it('findActiveOccasionsForCatalog queries active occasions', async () => {
    prisma.occasionType.findMany.mockResolvedValue([]);
    await repository.findActiveOccasionsForCatalog();
    expect(prisma.occasionType.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });
});
