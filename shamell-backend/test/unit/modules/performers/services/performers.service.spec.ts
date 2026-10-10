import { Test } from '@nestjs/testing';
import { PerformersService } from '@app/modules/performers/services/performers.service';

describe('PerformersService', () => {
  let service: PerformersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PerformersService],
    }).compile();
    service = moduleRef.get(PerformersService);
  });

  it('resolves from the testing module', () => {
    expect(service).toBeDefined();
  });
});
