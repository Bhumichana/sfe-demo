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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CallReportsService } from './call-reports.service';
import { CreateCallReportDto } from './dto/create-call-report.dto';
import { UpdateCallReportDto } from './dto/update-call-report.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AddCoachingDto } from './dto/add-coaching.dto';
import { CallReportStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('call-reports')
@Controller('call-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.SR, UserRole.SUP, UserRole.SM, UserRole.SD) // CEO cannot access
export class CallReportsController {
  constructor(private readonly callReportsService: CallReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call report / Check-in' })
  create(@Body() createDto: CreateCallReportDto) {
    return this.callReportsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all call reports (filtered by role permissions)' })
  @ApiQuery({ name: 'status', enum: CallReportStatus, required: false })
  @ApiQuery({ name: 'srId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: CallReportStatus,
    @Query('srId') srId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.callReportsService.findAll(user, status, srId, customerId, startDate, endDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all call reports for a specific user' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiQuery({ name: 'status', enum: CallReportStatus, required: false })
  findByUser(
    @CurrentUser() currentUser: any,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('status') status?: CallReportStatus,
  ) {
    return this.callReportsService.findByUser(currentUser, userId, status);
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
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.callReportsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SR) // Only SR can update their own reports
  @ApiOperation({ summary: 'Update a draft call report (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCallReportDto,
  ) {
    return this.callReportsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SR) // Only SR can delete their own reports
  @ApiOperation({ summary: 'Delete a draft call report (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.callReportsService.remove(id, user.id);
  }

  @Post(':id/submit')
  @Roles(UserRole.SR) // Only SR can submit their own reports
  @ApiOperation({ summary: 'Submit a draft call report (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  submit(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.callReportsService.submit(id, user.id);
  }

  @Post(':id/check-out')
  @Roles(UserRole.SR) // Only SR can check-out
  @ApiOperation({ summary: 'Check-out from a call (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  checkOut(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() checkOutDto: CheckOutDto,
  ) {
    return this.callReportsService.checkOut(id, user.id, checkOutDto);
  }

  @Post(':id/coach')
  @Roles(UserRole.SUP, UserRole.SM, UserRole.SD) // Only managers can coach
  @ApiOperation({ summary: 'Add coaching comments to a call report (Managers only)' })
  @ApiParam({ name: 'id', type: 'string' })
  addCoaching(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() coachingDto: AddCoachingDto,
  ) {
    // Set managerId from current user
    coachingDto.managerId = user.id;
    return this.callReportsService.addCoaching(user, id, coachingDto);
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
