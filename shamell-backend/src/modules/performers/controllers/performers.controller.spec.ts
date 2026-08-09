import { Test } from '@nestjs/testing';
import { makePerformersModuleMeta } from '../__mocks__/performers.fixtures';
import { createPerformersServiceMock } from '../__mocks__/performers.service.mock';
import { PERFORMERS_CONTROLLER_PATH } from '../constants/performers.constants';
import { PerformersService } from '../services/performers.service';
import { PerformersController } from './performers.controller';

describe('PerformersController', () => {
  let controller: PerformersController;
  const performersService = createPerformersServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PerformersController],
      providers: [{ provide: PerformersService, useValue: performersService }],
    }).compile();
    controller = moduleRef.get(PerformersController);
  });

  it('resolves from the testing module', () => {
    expect(controller).toBeDefined();
  });

  it('uses the performers controller path constant', () => {
    expect(makePerformersModuleMeta().controllerPath).toBe(
      PERFORMERS_CONTROLLER_PATH,
    );
    expect(Reflect.getMetadata('path', PerformersController)).toBe(
      PERFORMERS_CONTROLLER_PATH,
    );
  });
});
