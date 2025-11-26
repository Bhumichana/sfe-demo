import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanStatus, CallReportStatus, CustomerType } from '@prisma/client';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics for manager
   */
  async getDashboardStats(managerId: string, startDate?: string, endDate?: string) {
    // Verify manager exists
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    // Get subordinate IDs
    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    // Date filter
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Get stats in parallel
    const [
      totalCalls,
      todayCalls,
      monthCalls,
      pendingApprovals,
      totalTeamMembers,
      abcCoverage,
      submittedReports,
    ] = await Promise.all([
      // Total calls
      this.prisma.callReport.count({
        where: {
          srId: { in: subordinateIds },
          status: CallReportStatus.SUBMITTED,
          ...dateFilter,
        },
      }),

      // Today's calls
      this.prisma.callReport.count({
        where: {
          srId: { in: subordinateIds },
          status: CallReportStatus.SUBMITTED,
          callDate: this.getTodayDate(),
        },
      }),

      // This month's calls
      this.prisma.callReport.count({
        where: {
          srId: { in: subordinateIds },
          status: CallReportStatus.SUBMITTED,
          callDate: {
            gte: this.getStartOfMonth(),
            lte: this.getEndOfMonth(),
          },
        },
      }),

      // Pending approvals
      this.prisma.preCallPlan.count({
        where: {
          srId: { in: subordinateIds },
          status: PlanStatus.PENDING,
        },
      }),

      // Total team members
      this.prisma.user.count({
        where: { managerId },
      }),

      // ABC Coverage calculation
      this.calculateABCCoverage(subordinateIds, dateFilter),

      // Submitted reports awaiting review
      this.prisma.callReport.count({
        where: {
          srId: { in: subordinateIds },
          status: CallReportStatus.SUBMITTED,
          coachingRecords: { none: {} }, // No coaching yet
        },
      }),
    ]);

    return {
      totalCalls,
      todayCalls,
      monthCalls,
      pendingApprovals,
      totalTeamMembers,
      abcCoverage,
      submittedReports,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Get team members list
   */
  async getTeamMembers(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const teamMembers = await this.prisma.user.findMany({
      where: { managerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        territoryId: true,
        territory: {
          select: {
            id: true,
            code: true,
            nameTh: true,
            nameEn: true,
          },
        },
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Get performance stats for each team member
    const teamMembersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        const [totalCalls, monthCalls, pendingPlans, draftReports] = await Promise.all([
          this.prisma.callReport.count({
            where: {
              srId: member.id,
              status: CallReportStatus.SUBMITTED,
            },
          }),
          this.prisma.callReport.count({
            where: {
              srId: member.id,
              status: CallReportStatus.SUBMITTED,
              callDate: {
                gte: this.getStartOfMonth(),
                lte: this.getEndOfMonth(),
              },
            },
          }),
          this.prisma.preCallPlan.count({
            where: {
              srId: member.id,
              status: PlanStatus.PENDING,
            },
          }),
          this.prisma.callReport.count({
            where: {
              srId: member.id,
              status: CallReportStatus.DRAFT,
            },
          }),
        ]);

        return {
          ...member,
          stats: {
            totalCalls,
            monthCalls,
            pendingPlans,
            draftReports,
          },
        };
      }),
    );

    return {
      total: teamMembers.length,
      members: teamMembersWithStats,
    };
  }

  /**
   * Get call reports for review
   */
  async getCallReports(
    managerId: string,
    srId?: string,
    customerId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Get subordinate IDs
    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    // Build where clause
    const where: any = {
      srId: { in: subordinateIds },
      status: CallReportStatus.SUBMITTED,
    };

    if (srId) where.srId = srId;
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) {
      where.callDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const callReports = await this.prisma.callReport.findMany({
      where,
      include: {
        sr: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        customer: {
          select: { id: true, code: true, name: true, type: true, address: true },
        },
        contact: {
          select: { id: true, name: true, position: true, phone: true },
        },
        preCallPlan: {
          select: { id: true, status: true, objectives: true },
        },
        photos: {
          select: { id: true, category: true, url: true, thumbnailUrl: true },
        },
        coachingRecords: {
          include: {
            manager: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
      orderBy: { callDate: 'desc' },
    });

    return {
      total: callReports.length,
      reports: callReports,
    };
  }

  /**
   * Get all pre-call plans for team members
   */
  async getTeamPlans(managerId: string) {
    // Get subordinate IDs
    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    // Get all plans from team members
    const plans = await this.prisma.preCallPlan.findMany({
      where: {
        srId: { in: subordinateIds },
      },
      include: {
        sr: {
          select: { id: true, fullName: true, email: true },
        },
        customer: {
          select: { id: true, code: true, name: true, type: true },
        },
        contact: {
          select: { id: true, name: true, position: true, phone: true },
        },
      },
      orderBy: { planDate: 'asc' },
    });

    return plans;
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(managerId: string, startDate?: string, endDate?: string) {
    // Get subordinate IDs
    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: { id: true, fullName: true, email: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Get performance for each team member
    const performanceData = await Promise.all(
      subordinates.map(async (sr) => {
        const [totalCalls, plannedCalls, abcCustomersVisited, avgDuration] = await Promise.all([
          // Total calls
          this.prisma.callReport.count({
            where: {
              srId: sr.id,
              status: CallReportStatus.SUBMITTED,
              ...dateFilter,
            },
          }),

          // Planned calls
          this.prisma.callReport.count({
            where: {
              srId: sr.id,
              status: CallReportStatus.SUBMITTED,
              isPlanned: true,
              ...dateFilter,
            },
          }),

          // ABC customers visited
          this.getABCCustomersVisited(sr.id, dateFilter),

          // Average duration
          this.getAverageDuration(sr.id, dateFilter),
        ]);

        const plannedPercentage = totalCalls > 0 ? (plannedCalls / totalCalls) * 100 : 0;

        return {
          srId: sr.id,
          srName: sr.fullName,
          srEmail: sr.email,
          totalCalls,
          plannedCalls,
          plannedPercentage: Math.round(plannedPercentage * 100) / 100,
          abcCustomersVisited,
          avgDuration: Math.round(avgDuration),
        };
      }),
    );

    // Sort by total calls descending
    const sortedPerformance = performanceData.sort((a, b) => b.totalCalls - a.totalCalls);

    return {
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      teamSize: subordinates.length,
      performance: sortedPerformance,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getDateFilter(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return {
        callDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }
    return {};
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  private async calculateABCCoverage(subordinateIds: string[], dateFilter: any) {
    // Get total ABC customers in territories
    const territories = await this.prisma.user.findMany({
      where: { id: { in: subordinateIds } },
      select: { territoryId: true },
    });

    const territoryIds = [...new Set(territories.map((t) => t.territoryId).filter(Boolean))];

    const totalCustomers = await this.prisma.customer.groupBy({
      by: ['type'],
      where: {
        territoryId: { in: territoryIds as string[] },
        isActive: true,
      },
      _count: true,
    });

    // Get visited ABC customers
    const visitedCustomers = await this.prisma.callReport.groupBy({
      by: ['customerId'],
      where: {
        srId: { in: subordinateIds },
        status: CallReportStatus.SUBMITTED,
        customer: {
          type: { in: [CustomerType.A, CustomerType.B, CustomerType.C] },
        },
        ...dateFilter,
      },
      _count: true,
    });

    const totalABC = totalCustomers.reduce((sum, item) => sum + item._count, 0);
    const visitedABC = visitedCustomers.length;

    const coverage = totalABC > 0 ? (visitedABC / totalABC) * 100 : 0;

    return {
      total: totalABC,
      visited: visitedABC,
      percentage: Math.round(coverage * 100) / 100,
      breakdown: totalCustomers.map((item) => ({
        type: item.type,
        count: item._count,
      })),
    };
  }

  private async getABCCustomersVisited(srId: string, dateFilter: any) {
    const visited = await this.prisma.callReport.groupBy({
      by: ['customerId'],
      where: {
        srId,
        status: CallReportStatus.SUBMITTED,
        customer: {
          type: { in: [CustomerType.A, CustomerType.B, CustomerType.C] },
        },
        ...dateFilter,
      },
    });

    // Group by customer type
    const customerIds = visited.map((v) => v.customerId);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, type: true },
    });

    const breakdown = {
      A: customers.filter((c) => c.type === CustomerType.A).length,
      B: customers.filter((c) => c.type === CustomerType.B).length,
      C: customers.filter((c) => c.type === CustomerType.C).length,
    };

    return {
      total: visited.length,
      breakdown,
    };
  }

  private async getAverageDuration(srId: string, dateFilter: any) {
    const reports = await this.prisma.callReport.findMany({
      where: {
        srId,
        status: CallReportStatus.SUBMITTED,
        durationMinutes: { not: null },
        ...dateFilter,
      },
      select: { durationMinutes: true },
    });

    if (reports.length === 0) return 0;

    const totalDuration = reports.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
    return totalDuration / reports.length;
  }
}
