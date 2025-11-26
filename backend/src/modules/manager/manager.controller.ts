import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ManagerService } from './manager.service';

@ApiTags('manager')
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('dashboard/:managerId')
  @ApiOperation({ summary: 'Get manager dashboard statistics' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getDashboard(
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.managerService.getDashboardStats(managerId, startDate, endDate);
  }

  @Get('team/:managerId')
  @ApiOperation({ summary: 'Get team members list for manager' })
  @ApiParam({ name: 'managerId', type: 'string' })
  getTeamMembers(@Param('managerId', ParseUUIDPipe) managerId: string) {
    return this.managerService.getTeamMembers(managerId);
  }

  @Get('call-reports/:managerId')
  @ApiOperation({ summary: 'Get call reports for review by manager' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiQuery({ name: 'srId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getCallReports(
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @Query('srId') srId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.managerService.getCallReports(
      managerId,
      srId,
      customerId,
      startDate,
      endDate,
    );
  }

  @Get('team-plans/:managerId')
  @ApiOperation({ summary: 'Get all pre-call plans for team members' })
  @ApiParam({ name: 'managerId', type: 'string' })
  getTeamPlans(@Param('managerId', ParseUUIDPipe) managerId: string) {
    return this.managerService.getTeamPlans(managerId);
  }

  @Get('team-performance/:managerId')
  @ApiOperation({ summary: 'Get team performance metrics' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getTeamPerformance(
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.managerService.getTeamPerformance(managerId, startDate, endDate);
  }
}
