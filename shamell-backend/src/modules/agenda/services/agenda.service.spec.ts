import { Test } from '@nestjs/testing';
import { AdminPaymentsService } from '../../admin-payments/services/admin-payments.service';
import { ContactInboxService } from '../../contact/services/contact-inbox.service';
import { createAgendaPaymentsDepMock } from '../__mocks__/agenda-payments-dep.mock';
import { createAgendaRepositoryMock } from '../__mocks__/agenda.repository.mock';
import { createContactInboxServiceMock } from '../__mocks__/contact-inbox.service.mock';
import {
  makeHubBadgesQuery,
  makeServiceCatalogRow,
} from '../__mocks__/agenda.fixtures';
import { AgendaRepository } from './agenda.repository';
import { AgendaService } from './agenda.service';

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
