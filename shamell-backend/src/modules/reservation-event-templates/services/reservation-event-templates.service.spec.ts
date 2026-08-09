import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  makeFixedCreateDto,
  makeTemplateRow,
} from '../__mocks__/reservation-event-templates.fixtures';
import { createReservationEventTemplatesRepositoryMock } from '../__mocks__/reservation-event-templates.repository.mock';
import { ReservationEventTemplatesRepository } from './reservation-event-templates.repository';
import { ReservationEventTemplatesService } from './reservation-event-templates.service';

describe('ReservationEventTemplatesService', () => {
  let service: ReservationEventTemplatesService;
  const repository = createReservationEventTemplatesRepositoryMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReservationEventTemplatesService,
        {
          provide: ReservationEventTemplatesRepository,
          useValue: repository,
        },
      ],
    }).compile();
    service = moduleRef.get(ReservationEventTemplatesService);
  });

  it('listAdmin maps rows', async () => {
    repository.findManyAdmin.mockResolvedValue([makeTemplateRow()]);
    const result = await service.listAdmin();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tmpl-1');
  });

  it('getAdminById throws NotFound', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.getAdminById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createAdmin upserts unlinked same-name template', async () => {
    const existing = makeTemplateRow({ venueConfigs: [] });
    repository.findByName.mockResolvedValue(existing);
    repository.findById.mockResolvedValue(existing);
    repository.runTransaction.mockImplementation(async (fn) => fn({}));
    repository.deleteWeekdays.mockResolvedValue(undefined);
    repository.replaceClassSections.mockResolvedValue(undefined);
    repository.updateWithoutNestedSections.mockResolvedValue(existing);
    repository.findLinkedVenueConfigsForSync.mockResolvedValue([]);

    const result = await service.createAdmin(makeFixedCreateDto());
    expect(result.id).toBe('tmpl-1');
    expect(repository.updateWithoutNestedSections).toHaveBeenCalled();
  });

  it('createAdmin conflicts when same name is linked', async () => {
    repository.findByName.mockResolvedValue(
      makeTemplateRow({ venueConfigs: [{ eventId: 'e1' }] }),
    );
    await expect(service.createAdmin(makeFixedCreateDto())).rejects.toThrow(
      ConflictException,
    );
  });

  it('createAdmin creates new template', async () => {
    const created = makeTemplateRow();
    repository.findByName.mockResolvedValue(null);
    repository.runTransaction.mockImplementation(async (fn) => fn({}));
    repository.createWithoutClassSections.mockResolvedValue(created);
    repository.replaceClassSections.mockResolvedValue(undefined);
    repository.findByIdInTx.mockResolvedValue(created);
    repository.toPrismaCreateWithoutClassSections.mockReturnValue({});

    const result = await service.createAdmin(makeFixedCreateDto());
    expect(result.id).toBe('tmpl-1');
    expect(repository.createWithoutClassSections).toHaveBeenCalled();
  });

  it('deleteAdmin conflicts when linked', async () => {
    repository.findById.mockResolvedValue(makeTemplateRow());
    repository.countLinkedVenueConfigs.mockResolvedValue(3);
    await expect(service.deleteAdmin('tmpl-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('deleteAdmin deletes when unlinked', async () => {
    repository.findById.mockResolvedValue(makeTemplateRow());
    repository.countLinkedVenueConfigs.mockResolvedValue(0);
    repository.deleteTemplate.mockResolvedValue(undefined);
    await expect(service.deleteAdmin('tmpl-1')).resolves.toEqual({
      message: 'Reservation event deleted.',
    });
  });

  it('updateAdmin syncs linked venue configs when present', async () => {
    const existing = makeTemplateRow({
      venueConfigs: [{ eventId: 'event-1' }],
    });
    const updated = makeTemplateRow({
      venueConfigs: [{ eventId: 'event-1' }],
    });
    repository.findById.mockResolvedValue(existing);
    repository.runTransaction.mockImplementation(async (fn) => fn({}));
    repository.deleteWeekdays.mockResolvedValue(undefined);
    repository.replaceClassSections.mockResolvedValue(undefined);
    repository.updateWithoutNestedSections.mockResolvedValue(updated);
    repository.toPrismaUpdateWithoutNestedSections.mockReturnValue({});
    repository.findLinkedVenueConfigsForSync.mockResolvedValue([
      {
        eventId: 'event-1',
        reservationEventDate: new Date('2026-09-25T19:00:00.000Z'),
      },
    ]);
    repository.updateVenueConfigReservationFields.mockResolvedValue(undefined);

    await service.updateAdmin('tmpl-1', { name: 'Gala Night Updated' });
    expect(repository.updateVenueConfigReservationFields).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        reservationEventLabel: 'Gala Night',
      }),
    );
  });
});
