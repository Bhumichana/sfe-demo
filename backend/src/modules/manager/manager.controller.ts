import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('manager')
@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.SUP, UserRole.SM, UserRole.SD) // Only managers can access
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('dashboard/:managerId')
  @ApiOperation({ summary: 'Get manager dashboard statistics' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getDashboard(
    @CurrentUser() user: any,
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.managerService.getDashboardStats(user, managerId, startDate, endDate);
  }

  @Get('team/:managerId')
  @ApiOperation({ summary: 'Get team members list for manager' })
  @ApiParam({ name: 'managerId', type: 'string' })
  getTeamMembers(
    @CurrentUser() user: any,
    @Param('managerId', ParseUUIDPipe) managerId: string,
  ) {
    return this.managerService.getTeamMembers(user, managerId);
  }

  @Get('call-reports/:managerId')
  @ApiOperation({ summary: 'Get call reports for review by manager' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiQuery({ name: 'srId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getCallReports(
    @CurrentUser() user: any,
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @Query('srId') srId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.managerService.getCallReports(
      user,
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
  getTeamPlans(
    @CurrentUser() user: any,
    @Param('managerId', ParseUUIDPipe) managerId: string,
  ) {
    return this.managerService.getTeamPlans(user, managerId);
  }

  @Get('team-performance/:managerId')
  @ApiOperation({ summary: 'Get team performance metrics' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getTeamPerformance(
    @CurrentUser() user: any,
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.managerService.getTeamPerformance(user, managerId, startDate, endDate);
  }
}
