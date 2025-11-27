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
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiResponse({ status: 409, description: 'Team code already exists' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams with optional filters' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns list of teams' })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.teamsService.findAll(companyId, isActiveBoolean);
  }

  @Get('statistics/:companyId')
  @ApiOperation({ summary: 'Get team statistics for a company' })
  @ApiResponse({ status: 200, description: 'Returns team statistics' })
  getStatistics(@Param('companyId') companyId: string) {
    return this.teamsService.getStatistics(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiResponse({ status: 200, description: 'Returns team details' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 409, description: 'Team code already exists' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate team (soft delete)' })
  @ApiResponse({ status: 200, description: 'Team deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate team' })
  @ApiResponse({ status: 200, description: 'Team activated successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  activate(@Param('id') id: string) {
    return this.teamsService.activate(id);
  }
}
