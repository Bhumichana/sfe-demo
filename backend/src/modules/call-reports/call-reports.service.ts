import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCallReportDto } from './dto/create-call-report.dto';
import { UpdateCallReportDto } from './dto/update-call-report.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AddCoachingDto } from './dto/add-coaching.dto';
import { CallReportStatus } from '@prisma/client';

@Injectable()
export class CallReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new call report (Check-in)
   */
  async create(createDto: CreateCallReportDto) {
    // Verify customer, contact, and SR exist
    const [customer, contact, sr] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: createDto.customerId } }),
      this.prisma.contact.findUnique({ where: { id: createDto.contactId } }),
      this.prisma.user.findUnique({ where: { id: createDto.srId } }),
    ]);

    if (!customer) throw new NotFoundException('Customer not found');
    if (!contact) throw new NotFoundException('Contact not found');
    if (!sr) throw new NotFoundException('Sales Representative not found');

    // Verify Pre-Call Plan if provided
    if (createDto.preCallPlanId) {
      const plan = await this.prisma.preCallPlan.findUnique({
        where: { id: createDto.preCallPlanId },
      });

      if (!plan) throw new NotFoundException('Pre-Call Plan not found');
      if (plan.status !== 'APPROVED') {
        throw new BadRequestException('Pre-Call Plan must be approved');
      }
    }

    // GPS Validation (10 meters strict)
    if (createDto.checkInLat && createDto.checkInLng && customer.lat && customer.lng) {
      const distance = this.calculateDistance(
        createDto.checkInLat,
        createDto.checkInLng,
        Number(customer.lat),
        Number(customer.lng),
      );

      if (distance > 10) {
        throw new BadRequestException(
          `You are ${Math.round(distance)}m away from customer location. Maximum allowed is 10m.`,
        );
      }
    }

    return this.prisma.callReport.create({
      data: {
        preCallPlanId: createDto.preCallPlanId,
        srId: createDto.srId,
        customerId: createDto.customerId,
        contactId: createDto.contactId,
        callDate: new Date(createDto.callDate),
        checkInTime: createDto.checkInTime ? new Date(createDto.checkInTime) : undefined,
        checkInLat: createDto.checkInLat,
        checkInLng: createDto.checkInLng,
        callActivityType: createDto.callActivityType,
        activitiesDone: createDto.activitiesDone || [],
        customerResponse: createDto.customerResponse,
        customerRequest: createDto.customerRequest,
        customerObjections: createDto.customerObjections,
        customerNeeds: createDto.customerNeeds,
        customerComplaints: createDto.customerComplaints,
        nextAction: createDto.nextAction,
        isPlanned: createDto.isPlanned ?? false,
        status: CallReportStatus.DRAFT,
      },
      include: {
        sr: { select: { id: true, fullName: true, email: true } },
        customer: { select: { id: true, code: true, name: true, type: true } },
        contact: { select: { id: true, name: true, position: true, phone: true } },
        preCallPlan: { select: { id: true, objectives: true, status: true } },
      },
    });
  }

  /**
   * Get all call reports with filters
   */
  async findAll(
    status?: CallReportStatus,
    srId?: string,
    customerId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};

    if (status) where.status = status;
    if (srId) where.srId = srId;
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) {
      where.callDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.callReport.findMany({
      where,
      include: {
        sr: { select: { id: true, fullName: true, email: true } },
        customer: { select: { id: true, code: true, name: true, type: true, lat: true, lng: true, address: true } },
        contact: { select: { id: true, name: true, position: true } },
        preCallPlan: { select: { id: true, objectives: true, status: true } },
        photos: { select: { id: true, category: true, url: true, thumbnailUrl: true } },
        coachingRecords: {
          include: {
            manager: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { callDate: 'desc' },
    });
  }

  /**
   * Get one call report by ID
   */
  async findOne(id: string) {
    const report = await this.prisma.callReport.findUnique({
      where: { id },
      include: {
        sr: { select: { id: true, fullName: true, email: true, role: true } },
        customer: {
          select: { id: true, code: true, name: true, type: true, address: true, phone: true, lat: true, lng: true },
        },
        contact: { select: { id: true, name: true, position: true, phone: true, email: true } },
        preCallPlan: {
          select: { id: true, objectives: true, plannedActivities: true, status: true },
        },
        photos: {
          select: {
            id: true,
            category: true,
            url: true,
            thumbnailUrl: true,
            lat: true,
            lng: true,
            timestamp: true,
          },
        },
        coachingRecords: {
          include: {
            manager: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) throw new NotFoundException('Call Report not found');

    return report;
  }

  /**
   * Get call reports by user
   */
  async findByUser(userId: string, status?: CallReportStatus) {
    const where: any = { srId: userId };
    if (status) where.status = status;

    return this.prisma.callReport.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, name: true, type: true } },
        contact: { select: { id: true, name: true, position: true } },
        preCallPlan: { select: { id: true, status: true } },
        photos: { select: { id: true, category: true, thumbnailUrl: true } },
        coachingRecords: { select: { id: true, rating: true } },
      },
      orderBy: { callDate: 'desc' },
    });
  }

  /**
   * Update a draft call report
   */
  async update(id: string, userId: string, updateDto: UpdateCallReportDto) {
    const report = await this.prisma.callReport.findUnique({ where: { id } });

    if (!report) throw new NotFoundException('Call Report not found');
    if (report.srId !== userId)
      throw new ForbiddenException('You can only update your own reports');
    if (report.status !== CallReportStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be updated');
    }

    return this.prisma.callReport.update({
      where: { id },
      data: {
        ...(updateDto.callActivityType && { callActivityType: updateDto.callActivityType }),
        ...(updateDto.activitiesDone !== undefined && {
          activitiesDone: updateDto.activitiesDone,
        }),
        ...(updateDto.customerResponse !== undefined && {
          customerResponse: updateDto.customerResponse,
        }),
        ...(updateDto.customerRequest !== undefined && {
          customerRequest: updateDto.customerRequest,
        }),
        ...(updateDto.customerObjections !== undefined && {
          customerObjections: updateDto.customerObjections,
        }),
        ...(updateDto.customerNeeds !== undefined && { customerNeeds: updateDto.customerNeeds }),
        ...(updateDto.customerComplaints !== undefined && {
          customerComplaints: updateDto.customerComplaints,
        }),
        ...(updateDto.nextAction !== undefined && { nextAction: updateDto.nextAction }),
        ...(updateDto.durationMinutes !== undefined && {
          durationMinutes: updateDto.durationMinutes,
        }),
      },
      include: {
        sr: { select: { id: true, fullName: true } },
        customer: { select: { id: true, code: true, name: true } },
        contact: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a draft call report
   */
  async remove(id: string, userId: string) {
    const report = await this.prisma.callReport.findUnique({ where: { id } });

    if (!report) throw new NotFoundException('Call Report not found');
    if (report.srId !== userId)
      throw new ForbiddenException('You can only delete your own reports');
    if (report.status !== CallReportStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be deleted');
    }

    await this.prisma.callReport.delete({ where: { id } });
    return { message: 'Call Report deleted successfully' };
  }

  /**
   * Submit a draft call report
   */
  async submit(id: string, userId: string) {
    const report = await this.prisma.callReport.findUnique({
      where: { id },
      include: { sr: { select: { id: true, fullName: true, managerId: true } } },
    });

    if (!report) throw new NotFoundException('Call Report not found');
    if (report.srId !== userId)
      throw new ForbiddenException('You can only submit your own reports');
    if (report.status !== CallReportStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be submitted');
    }

    // Check deadline (2 days after call)
    const callDate = new Date(report.callDate);
    const deadline = new Date(callDate);
    deadline.setDate(deadline.getDate() + 2);
    deadline.setHours(23, 59, 59, 999);

    const now = new Date();
    if (now > deadline) {
      throw new BadRequestException(
        'Submission deadline passed. Reports must be submitted within 2 days.',
      );
    }

    // Update status to SUBMITTED
    const updatedReport = await this.prisma.callReport.update({
      where: { id },
      data: { status: CallReportStatus.SUBMITTED },
      include: {
        sr: { select: { id: true, fullName: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    // Create notification for manager
    if (report.sr.managerId) {
      await this.prisma.notification.create({
        data: {
          userId: report.sr.managerId,
          type: 'SYSTEM',
          title: 'New Call Report Submitted',
          message: `${report.sr.fullName} submitted a call report for ${updatedReport.customer.name}`,
          referenceType: 'CallReport',
          referenceId: updatedReport.id,
        },
      });
    }

    return updatedReport;
  }

  /**
   * Check-out from a call
   */
  async checkOut(id: string, userId: string, checkOutDto: CheckOutDto) {
    const report = await this.prisma.callReport.findUnique({
      where: { id },
      include: { customer: { select: { lat: true, lng: true } } },
    });

    if (!report) throw new NotFoundException('Call Report not found');
    if (report.srId !== userId)
      throw new ForbiddenException('You can only check-out your own reports');

    // GPS Validation (10 meters strict)
    if (report.customer.lat && report.customer.lng) {
      const distance = this.calculateDistance(
        checkOutDto.checkOutLat,
        checkOutDto.checkOutLng,
        Number(report.customer.lat),
        Number(report.customer.lng),
      );

      if (distance > 10) {
        throw new BadRequestException(
          `You are ${Math.round(distance)}m away from customer location. Maximum allowed is 10m.`,
        );
      }
    }

    // Calculate duration
    let durationMinutes: number | undefined;
    if (report.checkInTime) {
      const checkIn = new Date(report.checkInTime);
      const checkOut = new Date(checkOutDto.checkOutTime);
      durationMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
    }

    return this.prisma.callReport.update({
      where: { id },
      data: {
        checkOutTime: new Date(checkOutDto.checkOutTime),
        checkOutLat: checkOutDto.checkOutLat,
        checkOutLng: checkOutDto.checkOutLng,
        durationMinutes,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Add coaching comments (Manager)
   */
  async addCoaching(id: string, coachingDto: AddCoachingDto) {
    const report = await this.prisma.callReport.findUnique({
      where: { id },
      include: { sr: { select: { id: true, fullName: true } } },
    });

    if (!report) throw new NotFoundException('Call Report not found');
    if (report.status !== CallReportStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can receive coaching');
    }

    // Verify manager exists
    const manager = await this.prisma.user.findUnique({
      where: { id: coachingDto.managerId },
    });

    if (!manager) throw new NotFoundException('Manager not found');

    // Create coaching record
    const coaching = await this.prisma.coachingRecord.create({
      data: {
        callReportId: id,
        managerId: coachingDto.managerId,
        comments: coachingDto.comments,
        rating: coachingDto.rating,
        coachingPoints: coachingDto.coachingPoints,
      },
      include: {
        manager: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Create notification for SR
    await this.prisma.notification.create({
      data: {
        userId: report.srId,
        type: 'COACHING',
        title: 'Manager Coaching Received',
        message: `${manager.fullName} added coaching comments to your call report`,
        referenceType: 'CallReport',
        referenceId: id,
      },
    });

    return coaching;
  }

  // ============================================
  // Photo Management
  // ============================================

  /**
   * Add a photo to a call report
   */
  async addPhoto(
    callReportId: string,
    photoData: {
      category: string;
      url: string;
      thumbnailUrl?: string;
      lat?: number;
      lng?: number;
      timestamp: string;
      sizeBytes: number;
    },
  ) {
    // Verify call report exists
    const callReport = await this.prisma.callReport.findUnique({
      where: { id: callReportId },
    });

    if (!callReport) throw new NotFoundException('Call Report not found');

    // Create photo record
    const photo = await this.prisma.photo.create({
      data: {
        callReportId,
        category: photoData.category as any,
        url: photoData.url,
        thumbnailUrl: photoData.thumbnailUrl || photoData.url,
        lat: photoData.lat ? photoData.lat.toString() : null,
        lng: photoData.lng ? photoData.lng.toString() : null,
        timestamp: new Date(photoData.timestamp),
        sizeBytes: BigInt(photoData.sizeBytes),
      },
    });

    return {
      ...photo,
      sizeBytes: photo.sizeBytes.toString(), // Convert BigInt to string for JSON
    };
  }

  /**
   * Get all photos for a call report
   */
  async getPhotos(callReportId: string) {
    const callReport = await this.prisma.callReport.findUnique({
      where: { id: callReportId },
    });

    if (!callReport) throw new NotFoundException('Call Report not found');

    const photos = await this.prisma.photo.findMany({
      where: { callReportId },
      orderBy: { timestamp: 'desc' },
    });

    return photos.map((photo) => ({
      ...photo,
      sizeBytes: photo.sizeBytes.toString(), // Convert BigInt to string
    }));
  }

  /**
   * Delete a photo from a call report
   */
  async deletePhoto(callReportId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.callReportId !== callReportId) {
      throw new BadRequestException('Photo does not belong to this call report');
    }

    await this.prisma.photo.delete({ where: { id: photoId } });

    return { message: 'Photo deleted successfully' };
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
