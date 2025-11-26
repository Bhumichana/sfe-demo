import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseEnumPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PreCallPlansService } from './pre-call-plans.service';
import { CreatePreCallPlanDto } from './dto/create-pre-call-plan.dto';
import { UpdatePreCallPlanDto } from './dto/update-pre-call-plan.dto';
import { ApproveRejectPreCallPlanDto } from './dto/approve-reject-pre-call-plan.dto';
import { PlanStatus } from '@prisma/client';

@ApiTags('pre-call-plans')
@Controller('pre-call-plans')
export class PreCallPlansController {
  constructor(private readonly preCallPlansService: PreCallPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pre-call plan (draft)' })
  create(@Body() createDto: CreatePreCallPlanDto) {
    return this.preCallPlansService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pre-call plans with optional filters' })
  @ApiQuery({ name: 'status', enum: PlanStatus, required: false })
  @ApiQuery({ name: 'srId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  findAll(
    @Query('status') status?: PlanStatus,
    @Query('srId') srId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.preCallPlansService.findAll(status, srId, customerId, startDate, endDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all plans for a specific user (SR)' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiQuery({ name: 'status', enum: PlanStatus, required: false })
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('status') status?: PlanStatus,
  ) {
    return this.preCallPlansService.findByUser(userId, status);
  }

  @Get('pending-approvals/:managerId')
  @ApiOperation({ summary: 'Get pending approvals for a manager' })
  @ApiParam({ name: 'managerId', type: 'string' })
  findPendingApprovals(@Param('managerId', ParseUUIDPipe) managerId: string) {
    return this.preCallPlansService.findPendingApprovals(managerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific pre-call plan by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.preCallPlansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft pre-call plan' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdatePreCallPlanDto,
  ) {
    return this.preCallPlansService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft pre-call plan' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.preCallPlansService.remove(id, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft plan for approval' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'userId', description: 'User ID for authorization', required: true })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.preCallPlansService.submit(id, userId);
  }

  @Post(':id/approve-reject')
  @ApiOperation({ summary: 'Approve or reject a pending plan' })
  @ApiParam({ name: 'id', type: 'string' })
  approveOrReject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRejectPreCallPlanDto,
  ) {
    return this.preCallPlansService.approveOrReject(id, dto);
  }
}
