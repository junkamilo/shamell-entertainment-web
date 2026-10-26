import { Test } from '@nestjs/testing';
import { makeAboveFoldPayload } from '@test-support/modules/home/fixtures/home.fixtures';
import { createHomeServiceMock } from '@test-support/modules/home/mocks/home.service.mock';
import { HomeService } from '@app/modules/home/services/home.service';
import { HomeController } from '@app/modules/home/controllers/home.controller';

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
