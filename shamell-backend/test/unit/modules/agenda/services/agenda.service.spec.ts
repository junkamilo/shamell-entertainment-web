import { Test } from '@nestjs/testing';
import { AdminPaymentsService } from '@app/modules/admin-payments/services/admin-payments.service';
import { ContactInboxService } from '@app/modules/contact/services/contact-inbox.service';
import { createAgendaPaymentsDepMock } from '@test-support/modules/agenda/mocks/agenda-payments-dep.mock';
import { createAgendaRepositoryMock } from '@test-support/modules/agenda/mocks/agenda.repository.mock';
import { createContactInboxServiceMock } from '@test-support/modules/agenda/mocks/contact-inbox.service.mock';
import {
  makeHubBadgesQuery,
  makeServiceCatalogRow,
} from '@test-support/modules/agenda/fixtures/agenda.fixtures';
import { AgendaRepository } from '@app/modules/agenda/services/agenda.repository';
import { AgendaService } from '@app/modules/agenda/services/agenda.service';

describe('AgendaService', () => {
  let service: AgendaService;
  const repository = createAgendaRepositoryMock();
  const contactInbox = createContactInboxServiceMock();
  const adminPayments = createAgendaPaymentsDepMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AgendaService,
        { provide: AgendaRepository, useValue: repository },
        { provide: ContactInboxService, useValue: contactInbox },
        { provide: AdminPaymentsService, useValue: adminPayments },
      ],
    }).compile();
    service = moduleRef.get(AgendaService);
  });

  it('getHubBadges sums peticiones lanes and payments', async () => {
    contactInbox.countPeticionesBadge
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 3 });
    adminPayments.countBadgeSince.mockResolvedValue({ count: 4 });

    const query = makeHubBadgesQuery();
    await expect(service.getHubBadges(query)).resolves.toEqual({
      peticionesBadge: 6,
      paymentHistoryBadge: 4,
    });
    expect(contactInbox.countPeticionesBadge).toHaveBeenCalledTimes(3);
    expect(adminPayments.countBadgeSince).toHaveBeenCalledWith(
      query.paymentsSince,
    );
  });

  it('getAgendarCatalog maps services via repository', async () => {
    repository.findActiveServicesForCatalog.mockResolvedValue([
      makeServiceCatalogRow(),
    ]);
    repository.findBookingEligibleEventTypes.mockResolvedValue([
      { id: 'et-1', name: 'Wedding' },
    ]);
    repository.findActiveOccasionsForCatalog.mockResolvedValue([
      { id: 'occ-1', name: 'Anniversary' },
    ]);

    await expect(service.getAgendarCatalog()).resolves.toEqual({
      services: [{ id: 'svc-1', serviceTypeName: 'Dance' }],
      eventTypes: [{ id: 'et-1', name: 'Wedding' }],
      occasions: [{ id: 'occ-1', name: 'Anniversary' }],
    });
  });
});
