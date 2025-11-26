import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallReportStatus, CustomerType, CallActivityType } from '@prisma/client';
import { ExportReportDto, ExportFormat } from './dto/export-report.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get analytics overview
   */
  async getOverview(
    companyId: string,
    territoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const userFilter = await this.getUserFilter(companyId, territoryId);
    const dateFilter = this.getDateFilter(startDate, endDate);

    const [
      totalCalls,
      avgCallsPerDay,
      callsByType,
      abcCoverage,
      topActivities,
      totalSRs,
    ] = await Promise.all([
      // Total calls
      this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          ...dateFilter,
        },
      }),

      // Average calls per day
      this.getAvgCallsPerDay(userFilter, dateFilter),

      // Calls by type
      this.getCallsByType(userFilter, dateFilter),

      // ABC coverage
      this.getABCCoverage(companyId, territoryId, dateFilter),

      // Top 5 activities
      this.getTopActivities(userFilter, dateFilter, 5),

      // Total SRs
      this.prisma.user.count({
        where: {
          companyId,
          ...(territoryId && { territoryId }),
          role: 'SR',
        },
      }),
    ]);

    return {
      totalCalls,
      avgCallsPerDay,
      callsByType,
      abcCoverage,
      topActivities,
      totalSRs,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Get call metrics
   */
  async getCallMetrics(
    companyId: string,
    territoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const userFilter = await this.getUserFilter(companyId, territoryId);
    const dateFilter = this.getDateFilter(startDate, endDate);

    const [
      totalCalls,
      plannedCalls,
      unplannedCalls,
      virtualCalls,
      faceToFaceCalls,
      avgDuration,
      callsByDay,
      callsByMonth,
    ] = await Promise.all([
      // Total calls
      this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          ...dateFilter,
        },
      }),

      // Planned calls
      this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          isPlanned: true,
          ...dateFilter,
        },
      }),

      // Unplanned calls
      this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          isPlanned: false,
          ...dateFilter,
        },
      }),

      // Virtual calls
      this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          callActivityType: CallActivityType.VIRTUAL,
          ...dateFilter,
        },
      }),

      // Face-to-face calls
      this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          callActivityType: CallActivityType.FACE_TO_FACE,
          ...dateFilter,
        },
      }),

      // Average duration
      this.getAvgDuration(userFilter, dateFilter),

      // Calls by day of week
      this.getCallsByDayOfWeek(userFilter, dateFilter),

      // Calls by month (last 6 months)
      this.getCallsByMonth(userFilter, 6),
    ]);

    const plannedPercentage = totalCalls > 0 ? (plannedCalls / totalCalls) * 100 : 0;

    return {
      totalCalls,
      plannedCalls,
      unplannedCalls,
      plannedPercentage: Math.round(plannedPercentage * 100) / 100,
      virtualCalls,
      faceToFaceCalls,
      avgDuration: Math.round(avgDuration),
      callsByDay,
      callsByMonth,
    };
  }

  /**
   * Get ABC coverage
   */
  async getCoverage(
    companyId: string,
    territoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.getDateFilter(startDate, endDate);
    return this.getABCCoverage(companyId, territoryId, dateFilter);
  }

  /**
   * Get activity breakdown
   */
  async getActivities(
    companyId: string,
    territoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const userFilter = await this.getUserFilter(companyId, territoryId);
    const dateFilter = this.getDateFilter(startDate, endDate);

    const [topActivities, timeAllocationABC] = await Promise.all([
      this.getTopActivities(userFilter, dateFilter, 10),
      this.getTimeAllocationByCustomerType(userFilter, dateFilter),
    ]);

    return {
      topActivities,
      timeAllocationABC,
    };
  }

  /**
   * Get customer insights
   */
  async getInsights(
    companyId: string,
    territoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const userFilter = await this.getUserFilter(companyId, territoryId);
    const dateFilter = this.getDateFilter(startDate, endDate);

    const callReports = await this.prisma.callReport.findMany({
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        ...dateFilter,
      },
      select: {
        customerObjections: true,
        customerNeeds: true,
        customerComplaints: true,
        customerRequest: true,
      },
    });

    // Aggregate insights (simple text aggregation - could be enhanced with NLP)
    const insights = {
      topObjections: this.aggregateTextInsights(
        callReports.map((r) => r.customerObjections).filter(Boolean) as string[],
        5,
      ),
      topNeeds: this.aggregateTextInsights(
        callReports.map((r) => r.customerNeeds).filter(Boolean) as string[],
        5,
      ),
      topComplaints: this.aggregateTextInsights(
        callReports.map((r) => r.customerComplaints).filter(Boolean) as string[],
        5,
      ),
      topRequests: this.aggregateTextInsights(
        callReports.map((r) => r.customerRequest).filter(Boolean) as string[],
        5,
      ),
      totalReportsWithInsights: callReports.length,
    };

    return insights;
  }

  /**
   * Get team performance
   */
  async getTeamPerformance(
    companyId: string,
    territoryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Get all SRs
    const srs = await this.prisma.user.findMany({
      where: {
        companyId,
        ...(territoryId && { territoryId }),
        role: 'SR',
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        territoryId: true,
        territory: {
          select: {
            code: true,
            nameTh: true,
          },
        },
      },
    });

    // Get performance for each SR
    const performance = await Promise.all(
      srs.map(async (sr) => {
        const [totalCalls, plannedCalls, abcCalls, avgDuration, avgRating] = await Promise.all([
          this.prisma.callReport.count({
            where: {
              srId: sr.id,
              status: CallReportStatus.SUBMITTED,
              ...dateFilter,
            },
          }),

          this.prisma.callReport.count({
            where: {
              srId: sr.id,
              status: CallReportStatus.SUBMITTED,
              isPlanned: true,
              ...dateFilter,
            },
          }),

          this.prisma.callReport.count({
            where: {
              srId: sr.id,
              status: CallReportStatus.SUBMITTED,
              customer: {
                type: { in: [CustomerType.A, CustomerType.B, CustomerType.C] },
              },
              ...dateFilter,
            },
          }),

          this.getAvgDurationForSR(sr.id, dateFilter),

          this.getAvgRatingForSR(sr.id, dateFilter),
        ]);

        const plannedPercentage = totalCalls > 0 ? (plannedCalls / totalCalls) * 100 : 0;

        return {
          srId: sr.id,
          srName: sr.fullName,
          srEmail: sr.email,
          territory: sr.territory,
          totalCalls,
          plannedCalls,
          plannedPercentage: Math.round(plannedPercentage * 100) / 100,
          abcCalls,
          avgDuration: Math.round(avgDuration),
          avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        };
      }),
    );

    // Sort by total calls descending
    const sorted = performance.sort((a, b) => b.totalCalls - a.totalCalls);

    return {
      total: srs.length,
      ranking: sorted,
    };
  }

  /**
   * Export analytics report
   */
  async exportReport(exportDto: ExportReportDto) {
    // TODO: Implement actual export logic with PDF/CSV generation
    // For now, return mock response

    const data = await this.getOverview(
      exportDto.companyId,
      exportDto.territoryId,
      exportDto.startDate,
      exportDto.endDate,
    );

    return {
      message: 'Export functionality coming soon',
      format: exportDto.format,
      data,
      downloadUrl: null, // Will be S3 URL or file path
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async getUserFilter(companyId: string, territoryId?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        ...(territoryId && { territoryId }),
      },
      select: { id: true },
    });

    return { srId: { in: users.map((u) => u.id) } };
  }

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

  private async getAvgCallsPerDay(userFilter: any, dateFilter: any) {
    const calls = await this.prisma.callReport.findMany({
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        ...dateFilter,
      },
      select: { callDate: true },
    });

    if (calls.length === 0) return 0;

    const uniqueDays = new Set(calls.map((c) => c.callDate.toISOString().split('T')[0]));
    return Math.round((calls.length / uniqueDays.size) * 10) / 10;
  }

  private async getCallsByType(userFilter: any, dateFilter: any) {
    const result = await this.prisma.callReport.groupBy({
      by: ['isPlanned', 'callActivityType'],
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        ...dateFilter,
      },
      _count: true,
    });

    return result.map((item) => ({
      type: item.isPlanned ? 'Planned' : 'Unplanned',
      activityType: item.callActivityType || 'Unknown',
      count: item._count,
    }));
  }

  private async getABCCoverage(companyId: string, territoryId?: string, dateFilter?: any) {
    // Total ABC customers
    const totalCustomers = await this.prisma.customer.groupBy({
      by: ['type'],
      where: {
        creator: {
          companyId,
          ...(territoryId && { territoryId }),
        },
        isActive: true,
      },
      _count: true,
    });

    // Visited ABC customers
    const visitedCustomers = await this.prisma.callReport.groupBy({
      by: ['customerId'],
      where: {
        sr: {
          companyId,
          ...(territoryId && { territoryId }),
        },
        status: CallReportStatus.SUBMITTED,
        customer: {
          type: { in: [CustomerType.A, CustomerType.B, CustomerType.C] },
        },
        ...dateFilter,
      },
    });

    // Get customer types for visited customers
    const visitedCustomerIds = visitedCustomers.map((v) => v.customerId);
    const visitedWithTypes = await this.prisma.customer.findMany({
      where: { id: { in: visitedCustomerIds } },
      select: { id: true, type: true },
    });

    const visitedByType = visitedWithTypes.reduce(
      (acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalByType = totalCustomers.reduce(
      (acc, item) => {
        acc[item.type] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalABC = Object.values(totalByType).reduce((sum, count) => sum + count, 0);
    const visitedABC = Object.values(visitedByType).reduce((sum, count) => sum + count, 0);

    const coverage = totalABC > 0 ? (visitedABC / totalABC) * 100 : 0;

    return {
      total: totalABC,
      visited: visitedABC,
      percentage: Math.round(coverage * 100) / 100,
      breakdown: [CustomerType.A, CustomerType.B, CustomerType.C].map((type) => ({
        type,
        total: totalByType[type] || 0,
        visited: visitedByType[type] || 0,
        percentage:
          totalByType[type] > 0
            ? Math.round(((visitedByType[type] || 0) / totalByType[type]) * 100 * 100) / 100
            : 0,
      })),
    };
  }

  private async getTopActivities(userFilter: any, dateFilter: any, limit: number) {
    const callReports = await this.prisma.callReport.findMany({
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        ...dateFilter,
      },
      select: { activitiesDone: true },
    });

    // Count activity occurrences
    const activityCounts: Record<string, number> = {};

    callReports.forEach((report) => {
      const activities = report.activitiesDone as string[];
      activities?.forEach((activityId) => {
        activityCounts[activityId] = (activityCounts[activityId] || 0) + 1;
      });
    });

    // Get activity details
    const activityIds = Object.keys(activityCounts);
    const activities = await this.prisma.activityType.findMany({
      where: { id: { in: activityIds } },
      select: { id: true, nameTh: true, nameEn: true, code: true },
    });

    const topActivities = activities
      .map((activity) => ({
        ...activity,
        count: activityCounts[activity.id],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return topActivities;
  }

  private async getTimeAllocationByCustomerType(userFilter: any, dateFilter: any) {
    const result = await this.prisma.callReport.groupBy({
      by: ['customerId'],
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        durationMinutes: { not: null },
        ...dateFilter,
      },
      _sum: {
        durationMinutes: true,
      },
    });

    // Get customer types
    const customerIds = result.map((r) => r.customerId);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, type: true },
    });

    const customerTypeMap = new Map(customers.map((c) => [c.id, c.type]));

    const timeByType: Record<string, number> = {};

    result.forEach((r) => {
      const type = customerTypeMap.get(r.customerId);
      if (type && r._sum.durationMinutes) {
        timeByType[type] = (timeByType[type] || 0) + r._sum.durationMinutes;
      }
    });

    return [CustomerType.A, CustomerType.B, CustomerType.C].map((type) => ({
      type,
      totalMinutes: timeByType[type] || 0,
      totalHours: Math.round((timeByType[type] || 0) / 60 * 10) / 10,
    }));
  }

  private async getAvgDuration(userFilter: any, dateFilter: any) {
    const reports = await this.prisma.callReport.findMany({
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        durationMinutes: { not: null },
        ...dateFilter,
      },
      select: { durationMinutes: true },
    });

    if (reports.length === 0) return 0;

    const total = reports.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
    return total / reports.length;
  }

  private async getAvgDurationForSR(srId: string, dateFilter: any) {
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

    const total = reports.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
    return total / reports.length;
  }

  private async getAvgRatingForSR(srId: string, dateFilter: any) {
    const coachingRecords = await this.prisma.coachingRecord.findMany({
      where: {
        callReport: {
          srId,
          status: CallReportStatus.SUBMITTED,
          ...dateFilter,
        },
        rating: { not: null },
      },
      select: { rating: true },
    });

    if (coachingRecords.length === 0) return null;

    const total = coachingRecords.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / coachingRecords.length;
  }

  private async getCallsByDayOfWeek(userFilter: any, dateFilter: any) {
    const calls = await this.prisma.callReport.findMany({
      where: {
        ...userFilter,
        status: CallReportStatus.SUBMITTED,
        ...dateFilter,
      },
      select: { callDate: true },
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const callsByDay = Array(7).fill(0);

    calls.forEach((call) => {
      const dayOfWeek = call.callDate.getDay();
      callsByDay[dayOfWeek]++;
    });

    return dayNames.map((day, index) => ({
      day,
      count: callsByDay[index],
    }));
  }

  private async getCallsByMonth(userFilter: any, months: number) {
    const now = new Date();
    const monthData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await this.prisma.callReport.count({
        where: {
          ...userFilter,
          status: CallReportStatus.SUBMITTED,
          callDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      monthData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    return monthData;
  }

  private aggregateTextInsights(texts: string[], topN: number) {
    // Simple keyword extraction (can be enhanced with NLP)
    const wordCounts: Record<string, number> = {};

    texts.forEach((text) => {
      // Split by common delimiters and clean
      const words = text
        .toLowerCase()
        .split(/[,.\s]+/)
        .filter((word) => word.length > 3); // Filter short words

      words.forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    // Sort and get top N
    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    return sorted.map(([keyword, count]) => ({
      keyword,
      count,
    }));
  }
}
