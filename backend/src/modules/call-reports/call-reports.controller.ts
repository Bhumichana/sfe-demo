import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CallReportsService } from './call-reports.service';
import { CreateCallReportDto } from './dto/create-call-report.dto';
import { UpdateCallReportDto } from './dto/update-call-report.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AddCoachingDto } from './dto/add-coaching.dto';
import { CallReportStatus } from '@prisma/client';

@ApiTags('call-reports')
@Controller('call-reports')
export class CallReportsController {
  constructor(private readonly callReportsService: CallReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call report / Check-in' })
  create(@Body() createDto: CreateCallReportDto) {
    return this.callReportsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all call reports with optional filters' })
  @ApiQuery({ name: 'status', enum: CallReportStatus, required: false })
  @ApiQuery({ name: 'srId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  findAll(
    @Query('status') status?: CallReportStatus,
    @Query('srId') srId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.callReportsService.findAll(status, srId, customerId, startDate, endDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all call reports for a specific user (SR)' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiQuery({ name: 'status', enum: CallReportStatus, required: false })
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('status') status?: CallReportStatus,
  ) {
    return this.callReportsService.findByUser(userId, status);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'Get all photos for a call report' })
  @ApiParam({ name: 'id', type: 'string' })
  getPhotos(@Param('id', ParseUUIDPipe) id: string) {
    return this.callReportsService.getPhotos(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific call report by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.callReportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft call report' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdateCallReportDto,
  ) {
    return this.callReportsService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft call report' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.callReportsService.remove(id, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft call report' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.callReportsService.submit(id, userId);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Check-out from a call' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  checkOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Body() checkOutDto: CheckOutDto,
  ) {
    return this.callReportsService.checkOut(id, userId, checkOutDto);
  }

  @Post(':id/coach')
  @ApiOperation({ summary: 'Add coaching comments to a call report (Manager)' })
  @ApiParam({ name: 'id', type: 'string' })
  addCoaching(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() coachingDto: AddCoachingDto,
  ) {
    return this.callReportsService.addCoaching(id, coachingDto);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Add a photo to a call report' })
  @ApiParam({ name: 'id', type: 'string' })
  addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() photoData: {
      category: string;
      url: string;
      thumbnailUrl?: string;
      lat?: number;
      lng?: number;
      timestamp: string;
      sizeBytes: number;
    },
  ) {
    return this.callReportsService.addPhoto(id, photoData);
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Delete a photo from a call report' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiParam({ name: 'photoId', type: 'string' })
  deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.callReportsService.deletePhoto(id, photoId);
  }
}
