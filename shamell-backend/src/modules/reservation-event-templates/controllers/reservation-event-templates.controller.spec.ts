import { Test } from '@nestjs/testing';
import { ReservationEventScheduleMode } from '@prisma/client';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import {
  makeFixedCreateDto,
  makeTemplateRow,
} from '../__mocks__/reservation-event-templates.fixtures';
import { createReservationEventTemplatesServiceMock } from '../__mocks__/reservation-event-templates.service.mock';
import { mapTemplate } from '../utils/reservation-event-template-mapper.util';
import { ReservationEventTemplatesService } from '../services/reservation-event-templates.service';
import { ReservationEventTemplatesController } from './reservation-event-templates.controller';

describe('ReservationEventTemplatesController', () => {
  let controller: ReservationEventTemplatesController;
  const templatesService = createReservationEventTemplatesServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ReservationEventTemplatesController],
      providers: [
        {
          provide: ReservationEventTemplatesService,
          useValue: templatesService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(ReservationEventTemplatesController);
  });

  it('listAdmin passes valid scheduleMode', async () => {
    const payload = [mapTemplate(makeTemplateRow())];
    templatesService.listAdmin.mockResolvedValue(payload);
    await expect(
      controller.listAdmin(ReservationEventScheduleMode.FIXED_EVENT),
    ).resolves.toEqual(payload);
    expect(templatesService.listAdmin).toHaveBeenCalledWith(
      ReservationEventScheduleMode.FIXED_EVENT,
    );
  });

  it('listAdmin ignores invalid scheduleMode', async () => {
    templatesService.listAdmin.mockResolvedValue([]);
    await controller.listAdmin('NOPE' as ReservationEventScheduleMode);
    expect(templatesService.listAdmin).toHaveBeenCalledWith(undefined);
  });

  it('getAdmin delegates', async () => {
    const payload = mapTemplate(makeTemplateRow());
    templatesService.getAdminById.mockResolvedValue(payload);
    await expect(controller.getAdmin('tmpl-1')).resolves.toEqual(payload);
  });

  it('createAdmin delegates', async () => {
    const dto = makeFixedCreateDto();
    const payload = mapTemplate(makeTemplateRow());
    templatesService.createAdmin.mockResolvedValue(payload);
    await expect(controller.createAdmin(dto)).resolves.toEqual(payload);
    expect(templatesService.createAdmin).toHaveBeenCalledWith(dto);
  });

  it('updateAdmin and deleteAdmin delegate', async () => {
    templatesService.updateAdmin.mockResolvedValue(
      mapTemplate(makeTemplateRow()),
    );
    templatesService.deleteAdmin.mockResolvedValue({
      message: 'Reservation event deleted.',
    });
    await controller.updateAdmin('tmpl-1', { name: 'New' });
    await controller.deleteAdmin('tmpl-1');
    expect(templatesService.updateAdmin).toHaveBeenCalledWith('tmpl-1', {
      name: 'New',
    });
    expect(templatesService.deleteAdmin).toHaveBeenCalledWith('tmpl-1');
  });
});
