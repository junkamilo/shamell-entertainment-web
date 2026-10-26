import { Test, type TestingModule } from '@nestjs/testing';
import { createPrismaMock, type PrismaMock } from '@app/testing';
import { PrismaService } from '@app/prisma/prisma.service';
import { UpcomingEventsRepository } from '@app/modules/upcoming-events/services/upcoming-events.repository';

export type UpcomingEventsRepositoryTestHarness = {
  moduleRef: TestingModule;
  repository: UpcomingEventsRepository;
  prisma: PrismaMock;
};

/** Real UpcomingEventsRepository + prisma mock (contact/bookings repo unit pattern). */
export async function createUpcomingEventsRepositoryTestModule(): Promise<UpcomingEventsRepositoryTestHarness> {
  const prisma = createPrismaMock();
  const moduleRef = await Test.createTestingModule({
    providers: [
      UpcomingEventsRepository,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();

  return {
    moduleRef,
    repository: moduleRef.get(UpcomingEventsRepository),
    prisma,
  };
}
