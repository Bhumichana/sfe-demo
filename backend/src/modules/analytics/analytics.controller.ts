import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { ExportReportDto } from './dto/export-report.dto';

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
}
