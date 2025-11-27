import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TerritoriesService } from './territories.service';
import { CreateTerritoryDto, UpdateTerritoryDto } from './dto';

@ApiTags('territories')
@Controller('territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new territory' })
  @ApiResponse({ status: 201, description: 'Territory created successfully' })
  @ApiResponse({ status: 409, description: 'Territory code already exists' })
  create(@Body() createTerritoryDto: CreateTerritoryDto) {
    return this.territoriesService.create(createTerritoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all territories with optional filters' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns list of territories' })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.territoriesService.findAll(companyId, isActiveBoolean);
  }

  @Get('statistics/:companyId')
  @ApiOperation({ summary: 'Get territory statistics for a company' })
  @ApiResponse({ status: 200, description: 'Returns territory statistics' })
  getStatistics(@Param('companyId') companyId: string) {
    return this.territoriesService.getStatistics(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get territory by ID' })
  @ApiResponse({ status: 200, description: 'Returns territory details' })
  @ApiResponse({ status: 404, description: 'Territory not found' })
  findOne(@Param('id') id: string) {
    return this.territoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update territory' })
  @ApiResponse({ status: 200, description: 'Territory updated successfully' })
  @ApiResponse({ status: 404, description: 'Territory not found' })
  @ApiResponse({ status: 409, description: 'Territory code already exists' })
  update(@Param('id') id: string, @Body() updateTerritoryDto: UpdateTerritoryDto) {
    return this.territoriesService.update(id, updateTerritoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate territory (soft delete)' })
  @ApiResponse({ status: 200, description: 'Territory deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Territory not found' })
  remove(@Param('id') id: string) {
    return this.territoriesService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate territory' })
  @ApiResponse({ status: 200, description: 'Territory activated successfully' })
  @ApiResponse({ status: 404, description: 'Territory not found' })
  activate(@Param('id') id: string) {
    return this.territoriesService.activate(id);
  }
}
