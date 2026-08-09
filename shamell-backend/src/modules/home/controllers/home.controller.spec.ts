import { Test } from '@nestjs/testing';
import { makeAboveFoldPayload } from '../__mocks__/home.fixtures';
import { createHomeServiceMock } from '../__mocks__/home.service.mock';
import { HomeService } from '../services/home.service';
import { HomeController } from './home.controller';

describe('HomeController', () => {
  let controller: HomeController;
  const homeService = createHomeServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [{ provide: HomeService, useValue: homeService }],
    }).compile();
    controller = moduleRef.get(HomeController);
  });

  it('getAboveFold delegates to getAboveFoldData', async () => {
    const payload = makeAboveFoldPayload();
    homeService.getAboveFoldData.mockResolvedValue(payload);
    await expect(controller.getAboveFold()).resolves.toEqual(payload);
    expect(homeService.getAboveFoldData).toHaveBeenCalled();
  });
});
