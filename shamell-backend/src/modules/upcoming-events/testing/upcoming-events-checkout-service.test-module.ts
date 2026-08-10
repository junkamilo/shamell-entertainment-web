import { Test, type TestingModule } from '@nestjs/testing';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createPrismaMock, type PrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingEventsCheckoutService } from '../services/upcoming-events-checkout.service';
import { UpcomingEventsRepository } from '../services/upcoming-events.repository';

export type UpcomingEventsCheckoutServiceTestHarness = {
  moduleRef: TestingModule;
  service: UpcomingEventsCheckoutService;
  repository: ReturnType<typeof createUpcomingEventsRepositoryMock>;
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
};

export async function createUpcomingEventsCheckoutServiceTestModule(): Promise<UpcomingEventsCheckoutServiceTestHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();

  repository.asPrisma.mockReturnValue(prisma);
  repository.seatsRemaining.mockResolvedValue(10);
  stripe.frontendUrl = jest.fn().mockReturnValue('https://app.test');
  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_1',
    client_secret: 'sec_1',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_1' });

  const moduleRef = await Test.createTestingModule({
    providers: [
      UpcomingEventsCheckoutService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: StripeService, useValue: stripe },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(UpcomingEventsCheckoutService),
    repository,
    prisma,
    stripe,
  };
}
