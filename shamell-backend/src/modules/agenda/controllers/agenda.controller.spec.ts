import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createAgendaServiceMock } from '../__mocks__/agenda.service.mock';
import {
  makeAgendarCatalogResponse,
  makeHubBadgesQuery,
  makeHubBadgesResponse,
} from '../__mocks__/agenda.fixtures';
import { AgendaService } from '../services/agenda.service';
import { AgendaController } from './agenda.controller';

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
