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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PreCallPlansService } from './pre-call-plans.service';
import { CreatePreCallPlanDto } from './dto/create-pre-call-plan.dto';
import { UpdatePreCallPlanDto } from './dto/update-pre-call-plan.dto';
import { ApproveRejectPreCallPlanDto } from './dto/approve-reject-pre-call-plan.dto';
import { PlanStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('pre-call-plans')
@Controller('pre-call-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.SR, UserRole.SUP, UserRole.SM, UserRole.SD) // CEO cannot access
export class PreCallPlansController {
  constructor(private readonly preCallPlansService: PreCallPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pre-call plan (draft)' })
  create(@Body() createDto: CreatePreCallPlanDto) {
    return this.preCallPlansService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pre-call plans (filtered by role permissions)' })
  @ApiQuery({ name: 'status', enum: PlanStatus, required: false })
  @ApiQuery({ name: 'srId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-01-31' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: PlanStatus,
    @Query('srId') srId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.preCallPlansService.findAll(user, status, srId, customerId, startDate, endDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all plans for a specific user' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiQuery({ name: 'status', enum: PlanStatus, required: false })
  findByUser(
    @CurrentUser() currentUser: any,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('status') status?: PlanStatus,
  ) {
    return this.preCallPlansService.findByUser(currentUser, userId, status);
  }

  @Get('pending-approvals/:managerId')
  @Roles(UserRole.SUP, UserRole.SM, UserRole.SD) // Only managers can approve
  @ApiOperation({ summary: 'Get pending approvals for a manager' })
  @ApiParam({ name: 'managerId', type: 'string' })
  findPendingApprovals(
    @CurrentUser() currentUser: any,
    @Param('managerId', ParseUUIDPipe) managerId: string,
  ) {
    return this.preCallPlansService.findPendingApprovals(currentUser, managerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific pre-call plan by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.preCallPlansService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SR) // Only SR can update their own plans
  @ApiOperation({ summary: 'Update a draft pre-call plan (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePreCallPlanDto,
  ) {
    return this.preCallPlansService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SR) // Only SR can delete their own plans
  @ApiOperation({ summary: 'Delete a draft pre-call plan (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.preCallPlansService.remove(id, user.id);
  }

  @Post(':id/submit')
  @Roles(UserRole.SR) // Only SR can submit their own plans
  @ApiOperation({ summary: 'Submit a draft plan for approval (SR only)' })
  @ApiParam({ name: 'id', type: 'string' })
  submit(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.preCallPlansService.submit(id, user.id);
  }

  @Post(':id/approve-reject')
  @Roles(UserRole.SUP, UserRole.SM, UserRole.SD) // Only managers can approve/reject
  @ApiOperation({ summary: 'Approve or reject a pending plan (Managers only)' })
  @ApiParam({ name: 'id', type: 'string' })
  approveOrReject(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRejectPreCallPlanDto,
  ) {
    // Set approverId from current user
    dto.approverId = user.id;
    return this.preCallPlansService.approveOrReject(user, id, dto);
  }
}
