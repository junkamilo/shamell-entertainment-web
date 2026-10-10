import { Test, type TestingModule } from '@nestjs/testing';
import { createStripeServiceMock } from '@test-support/modules/stripe/mocks/stripe.service.mock';
import { StripeService } from '@app/modules/stripe/services/stripe.service';
import { createPrismaMock, type PrismaMock } from '@app/testing';
import { createUpcomingEventsRepositoryMock } from '@test-support/modules/upcoming-events/mocks/upcoming-events.repository.mock';
import { UpcomingFixedEventPackagesRepository } from '@app/modules/upcoming-events/packages/upcoming-fixed-event-packages.repository';
import { UpcomingEventsCheckoutService } from '@app/modules/upcoming-events/services/upcoming-events-checkout.service';
import { UpcomingEventsRepository } from '@app/modules/upcoming-events/services/upcoming-events.repository';

export type UpcomingEventsCheckoutServiceTestHarness = {
  moduleRef: TestingModule;
  service: UpcomingEventsCheckoutService;
  repository: ReturnType<typeof createUpcomingEventsRepositoryMock>;
  packagesRepository: {
    findPackageById: jest.Mock;
    listPackagesByEvent: jest.Mock;
    listActiveActivitiesByEvent: jest.Mock;
    minActivePackagePriceCents: jest.Mock;
    countActivePackagesByEvent: jest.Mock;
  };
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
};

export async function createUpcomingEventsCheckoutServiceTestModule(): Promise<UpcomingEventsCheckoutServiceTestHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();
  const packagesRepository = {
    findPackageById: jest.fn(),
    listPackagesByEvent: jest.fn(),
    listActiveActivitiesByEvent: jest.fn(),
    minActivePackagePriceCents: jest.fn(),
    countActivePackagesByEvent: jest.fn(),
  };

  repository.asPrisma.mockReturnValue(prisma);
  repository.seatsRemaining.mockResolvedValue(10);
  stripe.frontendUrl = jest.fn().mockReturnValue('https://app.test');
  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_1',
    client_secret: 'sec_1',
    payment_intent: 'pi_1',
  });
  stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
    id: 'cs_1',
    payment_intent: 'pi_1',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_1' });
  stripe.client.paymentIntents.update = jest.fn().mockResolvedValue({});
  stripe.client.paymentIntents.search = jest
    .fn()
    .mockResolvedValue({ data: [] });

  const moduleRef = await Test.createTestingModule({
    providers: [
      UpcomingEventsCheckoutService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: StripeService, useValue: stripe },
      {
        provide: UpcomingFixedEventPackagesRepository,
        useValue: packagesRepository,
      },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(UpcomingEventsCheckoutService),
    repository,
    packagesRepository,
    prisma,
    stripe,
  };
}
