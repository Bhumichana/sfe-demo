import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TerritoriesService } from './territories.service';

@ApiTags('territories')
@Controller('territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all territories' })
  @ApiResponse({ status: 200, description: 'Returns list of territories' })
  findAll() {
    return this.territoriesService.findAll();
  }
}
