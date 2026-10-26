import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import { createAgendaServiceMock } from '@test-support/modules/agenda/mocks/agenda.service.mock';
import {
  makeAgendarCatalogResponse,
  makeHubBadgesQuery,
  makeHubBadgesResponse,
} from '@test-support/modules/agenda/fixtures/agenda.fixtures';
import { AgendaService } from '@app/modules/agenda/services/agenda.service';
import { AgendaController } from '@app/modules/agenda/controllers/agenda.controller';

describe('AgendaController', () => {
  let controller: AgendaController;
  const agendaService = createAgendaServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [{ provide: AgendaService, useValue: agendaService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AgendaController);
  });

  it('getHubBadges delegates to service', async () => {
    const query = makeHubBadgesQuery();
    const payload = makeHubBadgesResponse();
    agendaService.getHubBadges.mockResolvedValue(payload);
    await expect(controller.getHubBadges(query)).resolves.toEqual(payload);
    expect(agendaService.getHubBadges).toHaveBeenCalledWith(query);
  });

  it('getAgendarCatalog delegates to service', async () => {
    const payload = makeAgendarCatalogResponse();
    agendaService.getAgendarCatalog.mockResolvedValue(payload);
    await expect(controller.getAgendarCatalog()).resolves.toEqual(payload);
    expect(agendaService.getAgendarCatalog).toHaveBeenCalled();
  });
});
