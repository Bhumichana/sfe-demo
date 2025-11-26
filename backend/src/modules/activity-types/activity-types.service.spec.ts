import { Test, TestingModule } from '@nestjs/testing';
import { ActivityTypesService } from './activity-types.service';

describe('ActivityTypesService', () => {
  let service: ActivityTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityTypesService],
    }).compile();

    service = module.get<ActivityTypesService>(ActivityTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
