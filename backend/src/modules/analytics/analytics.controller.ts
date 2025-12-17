import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { ExportReportDto } from './dto/export-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview for PM/MM dashboard' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  getOverview(
    @Query('companyId', ParseUUIDPipe) companyId: string,
    @Query('territoryId') territoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getOverview(
      companyId,
      territoryId,
      startDate,
      endDate,
    );
  }

  @Get('call-metrics')
  @ApiOperation({ summary: 'Get call metrics' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCallMetrics(
    @Query('companyId', ParseUUIDPipe) companyId: string,
    @Query('territoryId') territoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getCallMetrics(
      companyId,
      territoryId,
      startDate,
      endDate,
    );
  }

  @Get('coverage')
  @ApiOperation({ summary: 'Get ABC coverage metrics' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCoverage(
    @Query('companyId', ParseUUIDPipe) companyId: string,
    @Query('territoryId') territoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getCoverage(
      companyId,
      territoryId,
      startDate,
      endDate,
    );
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get activity breakdown' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getActivities(
    @Query('companyId', ParseUUIDPipe) companyId: string,
    @Query('territoryId') territoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getActivities(
      companyId,
      territoryId,
      startDate,
      endDate,
    );
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get customer insights (objections, needs, complaints, requests)' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getInsights(
    @Query('companyId', ParseUUIDPipe) companyId: string,
    @Query('territoryId') territoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getInsights(
      companyId,
      territoryId,
      startDate,
      endDate,
    );
  }

  @Get('team-performance')
  @ApiOperation({ summary: 'Get team performance rankings' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTeamPerformance(
    @Query('companyId', ParseUUIDPipe) companyId: string,
    @Query('territoryId') territoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTeamPerformance(
      companyId,
      territoryId,
      startDate,
      endDate,
    );
  }

  @Post('export')
  @ApiOperation({ summary: 'Export analytics report (PDF/CSV)' })
  exportReport(@Body() exportDto: ExportReportDto) {
    return this.analyticsService.exportReport(exportDto);
  }

  @Get('executive-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SM, UserRole.SD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get executive dashboard for SM/SD with all 4 analysis sections' })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  async getExecutiveDashboard(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const companyId = user.companyId;

    // Fetch all 4 sections in parallel for performance
    const [salesFunnel, territoryComparison, customerSegmentation, trendAnalysis] = await Promise.all([
      this.analyticsService.getSalesFunnel(companyId, startDate, endDate),
      this.analyticsService.getTerritoryComparison(companyId, startDate, endDate),
      this.analyticsService.getCustomerSegmentation(companyId),
      this.analyticsService.getTrendAnalysis(companyId, 6),
    ]);

    return {
      salesFunnel,
      territoryComparison,
      customerSegmentation,
      trendAnalysis,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }
}
