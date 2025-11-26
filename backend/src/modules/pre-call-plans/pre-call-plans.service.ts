import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePreCallPlanDto } from './dto/create-pre-call-plan.dto';
import { UpdatePreCallPlanDto } from './dto/update-pre-call-plan.dto';
import { ApproveRejectPreCallPlanDto, ApprovalAction } from './dto/approve-reject-pre-call-plan.dto';
import { PlanStatus } from '@prisma/client';

@Injectable()
export class PreCallPlansService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePreCallPlanDto) {
    // Verify customer, contact, and SR exist
    const [customer, contact, sr] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: createDto.customerId } }),
      this.prisma.contact.findUnique({ where: { id: createDto.contactId } }),
      this.prisma.user.findUnique({ where: { id: createDto.srId } }),
    ]);

    if (!customer) throw new NotFoundException('Customer not found');
    if (!contact) throw new NotFoundException('Contact not found');
    if (!sr) throw new NotFoundException('Sales Representative not found');

    console.log('📅 Received planDate:', createDto.planDate);
    const planDateObj = new Date(createDto.planDate);
    console.log('📅 Converted to Date:', planDateObj.toISOString());
    console.log('📅 Local time:', planDateObj.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }));

    return this.prisma.preCallPlan.create({
      data: {
        srId: createDto.srId,
        customerId: createDto.customerId,
        contactId: createDto.contactId,
        planDate: planDateObj,
        objectives: createDto.objectives,
        plannedActivities: createDto.plannedActivities || [],
        status: PlanStatus.DRAFT,
      },
      include: {
        sr: { select: { id: true, fullName: true, email: true } },
        customer: { select: { id: true, code: true, name: true, type: true, lat: true, lng: true, address: true } },
        contact: { select: { id: true, name: true, position: true, phone: true } },
      },
    });
  }

  async findAll(status?: PlanStatus, srId?: string, customerId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (status) where.status = status;
    if (srId) where.srId = srId;
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) {
      where.planDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.preCallPlan.findMany({
      where,
      include: {
        sr: { select: { id: true, fullName: true, email: true } },
        customer: { select: { id: true, code: true, name: true, type: true, lat: true, lng: true, address: true } },
        contact: { select: { id: true, name: true, position: true, phone: true } },
        approver: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { planDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.preCallPlan.findUnique({
      where: { id },
      include: {
        sr: { select: { id: true, fullName: true, email: true, role: true } },
        customer: { select: { id: true, code: true, name: true, type: true, address: true, phone: true } },
        contact: { select: { id: true, name: true, position: true, phone: true, email: true } },
        approver: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!plan) throw new NotFoundException('Pre-Call Plan not found');

    return plan;
  }

  async findByUser(userId: string, status?: PlanStatus) {
    const where: any = { srId: userId };
    if (status) where.status = status;

    return this.prisma.preCallPlan.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, name: true, type: true, lat: true, lng: true, address: true } },
        contact: { select: { id: true, name: true, position: true } },
        approver: { select: { id: true, fullName: true } },
      },
      orderBy: { planDate: 'desc' },
    });
  }

  async findPendingApprovals(managerId: string) {
    // Find all SRs under this manager
    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const subordinateIds = subordinates.map(s => s.id);

    return this.prisma.preCallPlan.findMany({
      where: {
        status: PlanStatus.PENDING,
        srId: { in: subordinateIds },
      },
      include: {
        sr: { select: { id: true, fullName: true, email: true } },
        customer: { select: { id: true, code: true, name: true, type: true, lat: true, lng: true, address: true } },
        contact: { select: { id: true, name: true, position: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, userId: string, updateDto: UpdatePreCallPlanDto) {
    const plan = await this.prisma.preCallPlan.findUnique({ where: { id } });

    if (!plan) throw new NotFoundException('Pre-Call Plan not found');
    if (plan.srId !== userId) throw new ForbiddenException('You can only update your own plans');
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('Only draft plans can be updated');
    }

    return this.prisma.preCallPlan.update({
      where: { id },
      data: {
        ...(updateDto.customerId && { customerId: updateDto.customerId }),
        ...(updateDto.contactId && { contactId: updateDto.contactId }),
        ...(updateDto.planDate && { planDate: new Date(updateDto.planDate) }),
        ...(updateDto.objectives !== undefined && { objectives: updateDto.objectives }),
        ...(updateDto.plannedActivities !== undefined && { plannedActivities: updateDto.plannedActivities }),
      },
      include: {
        sr: { select: { id: true, fullName: true } },
        customer: { select: { id: true, code: true, name: true, lat: true, lng: true, address: true } },
        contact: { select: { id: true, name: true, position: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const plan = await this.prisma.preCallPlan.findUnique({ where: { id } });

    if (!plan) throw new NotFoundException('Pre-Call Plan not found');
    if (plan.srId !== userId) throw new ForbiddenException('You can only delete your own plans');
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('Only draft plans can be deleted');
    }

    await this.prisma.preCallPlan.delete({ where: { id } });
    return { message: 'Pre-Call Plan deleted successfully' };
  }

  async submit(id: string, userId: string) {
    const plan = await this.prisma.preCallPlan.findUnique({ where: { id } });

    if (!plan) throw new NotFoundException('Pre-Call Plan not found');
    if (plan.srId !== userId) throw new ForbiddenException('You can only submit your own plans');
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('Only draft plans can be submitted');
    }

    // Update status to PENDING
    const updatedPlan = await this.prisma.preCallPlan.update({
      where: { id },
      data: { status: PlanStatus.PENDING },
      include: {
        sr: { select: { id: true, fullName: true, managerId: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    // TODO: Create notification for manager
    if (updatedPlan.sr.managerId) {
      await this.prisma.notification.create({
        data: {
          userId: updatedPlan.sr.managerId,
          type: 'PLAN_PENDING',
          title: 'New Pre-Call Plan Pending Approval',
          message: `${updatedPlan.sr.fullName} submitted a pre-call plan for ${updatedPlan.customer.name}`,
          referenceType: 'PreCallPlan',
          referenceId: updatedPlan.id,
        },
      });
    }

    return updatedPlan;
  }

  async approveOrReject(id: string, dto: ApproveRejectPreCallPlanDto) {
    const plan = await this.prisma.preCallPlan.findUnique({
      where: { id },
      include: { sr: { select: { id: true, fullName: true } } },
    });

    if (!plan) throw new NotFoundException('Pre-Call Plan not found');
    if (plan.status !== PlanStatus.PENDING) {
      throw new BadRequestException('Only pending plans can be approved or rejected');
    }

    const isApprove = dto.action === ApprovalAction.APPROVE;
    const newStatus = isApprove ? PlanStatus.APPROVED : PlanStatus.REJECTED;

    const updatedPlan = await this.prisma.preCallPlan.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: dto.approverId,
        approvedAt: new Date(),
        ...(dto.reason && { rejectionReason: dto.reason }),
      },
      include: {
        sr: { select: { id: true, fullName: true } },
        customer: { select: { id: true, name: true } },
        approver: { select: { id: true, fullName: true } },
      },
    });

    // Create notification for SR
    await this.prisma.notification.create({
      data: {
        userId: plan.srId,
        type: isApprove ? 'PLAN_APPROVED' : 'PLAN_REJECTED',
        title: isApprove ? 'Pre-Call Plan Approved' : 'Pre-Call Plan Rejected',
        message: isApprove
          ? `Your pre-call plan for ${updatedPlan.customer.name} has been approved`
          : `Your pre-call plan for ${updatedPlan.customer.name} was rejected. Reason: ${dto.reason || 'No reason provided'}`,
        referenceType: 'PreCallPlan',
        referenceId: updatedPlan.id,
      },
    });

    return updatedPlan;
  }
}
