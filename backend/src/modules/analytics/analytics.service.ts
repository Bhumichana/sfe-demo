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

  /**
   * Get Sales Funnel Analysis for Executives
   */
  async getSalesFunnel(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);

    // 1. Total Prospects = All active customers
    const totalProspects = await this.prisma.customer.count({
      where: {
        creator: { companyId },
        isActive: true,
      },
    });

    // 2. Leads = Customers with at least one PreCallPlan
    const leadsData = await this.prisma.preCallPlan.groupBy({
      by: ['customerId'],
      where: {
        sr: { companyId },
        ...dateFilter.callDate && { planDate: dateFilter.callDate },
      },
    });
    const totalLeads = leadsData.length;

    // 3. Opportunities = PreCallPlans with status APPROVED
    const opportunitiesData = await this.prisma.preCallPlan.groupBy({
      by: ['customerId'],
      where: {
        sr: { companyId },
        status: 'APPROVED',
        ...dateFilter.callDate && { planDate: dateFilter.callDate },
      },
    });
    const totalOpportunities = opportunitiesData.length;

    // 4. Wins = CallReports with positive outcome
    const winsData = await this.prisma.callReport.groupBy({
      by: ['customerId'],
      where: {
        sr: { companyId },
        status: CallReportStatus.SUBMITTED,
        OR: [
          { durationMinutes: { gte: 15 } }, // Meaningful conversation
          { nextAction: { not: null } }, // Follow-up planned
        ],
        ...dateFilter,
      },
    });
    const totalWins = winsData.length;

    // Calculate conversion rates
    const leadConversionRate = totalProspects > 0 ? (totalLeads / totalProspects) * 100 : 0;
    const opportunityConversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;
    const winRate = totalOpportunities > 0 ? (totalWins / totalOpportunities) * 100 : 0;

    // Calculate average deal cycle (from first plan to successful call)
    let avgDealCycle = 0;
    if (totalWins > 0) {
      const winCustomerIds = winsData.map(w => w.customerId);
      const deals = await this.prisma.callReport.findMany({
        where: {
          customerId: { in: winCustomerIds },
          status: CallReportStatus.SUBMITTED,
        },
        select: {
          customerId: true,
          callDate: true,
          preCallPlan: {
            select: { planDate: true },
          },
        },
      });

      const cycleTimes = deals
        .filter(d => d.preCallPlan?.planDate)
        .map(d => {
          const planDate = new Date(d.preCallPlan!.planDate);
          const callDate = new Date(d.callDate);
          const diffTime = Math.abs(callDate.getTime() - planDate.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
        });

      if (cycleTimes.length > 0) {
        avgDealCycle = Math.round(cycleTimes.reduce((sum, val) => sum + val, 0) / cycleTimes.length);
      }
    }

    return {
      funnel: [
        { stage: 'Prospects', count: totalProspects, percentage: 100 },
        { stage: 'Leads', count: totalLeads, percentage: Math.round(leadConversionRate * 100) / 100 },
        { stage: 'Opportunities', count: totalOpportunities, percentage: Math.round(opportunityConversionRate * 100) / 100 },
        { stage: 'Wins', count: totalWins, percentage: Math.round(winRate * 100) / 100 },
      ],
      metrics: {
        leadConversionRate: Math.round(leadConversionRate * 100) / 100,
        opportunityConversionRate: Math.round(opportunityConversionRate * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        avgDealCycle,
      },
    };
  }

  /**
   * Get Territory Comparison for Executives
   */
  async getTerritoryComparison(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Get all territories for this company
    const territories = await this.prisma.territory.findMany({
      where: { companyId, isActive: true },
      select: { id: true, code: true, nameTh: true, nameEn: true },
    });

    // Get performance data for each territory
    const performanceData = await Promise.all(
      territories.map(async (territory) => {
        const [totalCalls, teamSize, abcCoverage] = await Promise.all([
          // Total calls in this territory
          this.prisma.callReport.count({
            where: {
              sr: { companyId, territoryId: territory.id },
              status: CallReportStatus.SUBMITTED,
              ...dateFilter,
            },
          }),

          // Team size (SRs in this territory)
          this.prisma.user.count({
            where: {
              companyId,
              territoryId: territory.id,
              role: 'SR',
              isActive: true,
            },
          }),

          // ABC Coverage
          this.getABCCoverage(companyId, territory.id, dateFilter),
        ]);

        // Calculate average calls per SR
        const avgCallsPerSR = teamSize > 0 ? Math.round((totalCalls / teamSize) * 100) / 100 : 0;

        return {
          territoryId: territory.id,
          territoryCode: territory.code,
          territoryName: territory.nameTh,
          totalCalls,
          teamSize,
          avgCallsPerSR,
          abcCoverage: abcCoverage.percentage,
        };
      }),
    );

    // Sort by total calls descending
    const sorted = performanceData.sort((a, b) => b.totalCalls - a.totalCalls);

    return {
      total: territories.length,
      territories: sorted,
    };
  }

  /**
   * Get Customer Segmentation Analysis for Executives
   */
  async getCustomerSegmentation(companyId: string) {
    // ABC Distribution
    const abcDistribution = await this.prisma.customer.groupBy({
      by: ['type'],
      where: {
        creator: { companyId },
        isActive: true,
      },
      _count: true,
    });

    const totalCustomers = abcDistribution.reduce((sum, item) => sum + item._count, 0);

    const abcBreakdown = abcDistribution.map((item) => ({
      type: item.type,
      count: item._count,
      percentage: totalCustomers > 0 ? Math.round((item._count / totalCustomers) * 100 * 100) / 100 : 0,
    }));

    // Geographic distribution by territory
    const geoDistribution = await this.prisma.customer.groupBy({
      by: ['territoryId'],
      where: {
        creator: { companyId },
        isActive: true,
        territoryId: { not: null },
      },
      _count: true,
    });

    const territoryIds = geoDistribution.map(g => g.territoryId).filter(Boolean) as string[];
    const territories = await this.prisma.territory.findMany({
      where: { id: { in: territoryIds } },
      select: { id: true, code: true, nameTh: true },
    });

    const geoBreakdown = geoDistribution.map((item) => {
      const territory = territories.find(t => t.id === item.territoryId);
      return {
        territoryId: item.territoryId,
        territoryName: territory?.nameTh || 'Unknown',
        territoryCode: territory?.code || 'N/A',
        count: item._count,
        percentage: totalCustomers > 0 ? Math.round((item._count / totalCustomers) * 100 * 100) / 100 : 0,
      };
    });

    // Visit frequency analysis (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const visitFrequency = await this.prisma.callReport.groupBy({
      by: ['customerId'],
      where: {
        sr: { companyId },
        status: CallReportStatus.SUBMITTED,
        callDate: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    // Categorize by visit frequency
    const highFrequency = visitFrequency.filter(v => v._count >= 10).length;
    const mediumFrequency = visitFrequency.filter(v => v._count >= 5 && v._count < 10).length;
    const lowFrequency = visitFrequency.filter(v => v._count < 5).length;

    return {
      totalCustomers,
      abcDistribution: abcBreakdown,
      geoDistribution: geoBreakdown,
      visitFrequency: {
        high: highFrequency,
        medium: mediumFrequency,
        low: lowFrequency,
        total: visitFrequency.length,
      },
    };
  }

  /**
   * Get Trend Analysis with Simple Forecasting for Executives
   */
  async getTrendAnalysis(companyId: string, months: number = 6) {
    const userFilter = await this.getUserFilter(companyId);
    const now = new Date();
    const historicalData = [];

    // Get historical data for last N months
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

      historicalData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count,
        date: date.toISOString(),
      });
    }

    // Calculate month-over-month growth rates
    const growthRates = historicalData.map((item, index) => {
      if (index === 0) return { ...item, growthRate: 0 };
      const prevCount = historicalData[index - 1].count;
      const growthRate = prevCount > 0 ? ((item.count - prevCount) / prevCount) * 100 : 0;
      return {
        ...item,
        growthRate: Math.round(growthRate * 100) / 100,
      };
    });

    // Simple forecast using moving average
    const last6Months = historicalData.slice(-6);
    const movingAvg = last6Months.reduce((sum, val) => sum + val.count, 0) / last6Months.length;

    const forecast = [
      {
        month: new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: Math.round(movingAvg),
        isForecast: true,
      },
      {
        month: new Date(now.getFullYear(), now.getMonth() + 2, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: Math.round(movingAvg * 1.05),
        isForecast: true,
      },
      {
        month: new Date(now.getFullYear(), now.getMonth() + 3, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: Math.round(movingAvg * 1.1),
        isForecast: true,
      },
    ];

    // Determine trend direction
    const lastThreeMonths = historicalData.slice(-3);
    const avgLastThree = lastThreeMonths.reduce((sum, val) => sum + val.count, 0) / 3;
    const firstThreeMonths = historicalData.slice(0, 3);
    const avgFirstThree = firstThreeMonths.reduce((sum, val) => sum + val.count, 0) / 3;

    let trendDirection = 'stable';
    if (avgLastThree > avgFirstThree * 1.1) {
      trendDirection = 'growing';
    } else if (avgLastThree < avgFirstThree * 0.9) {
      trendDirection = 'declining';
    }

    return {
      historical: growthRates,
      forecast,
      trendDirection,
      summary: {
        totalCalls: historicalData.reduce((sum, val) => sum + val.count, 0),
        avgPerMonth: Math.round(movingAvg),
        highestMonth: historicalData.reduce((max, val) => val.count > max.count ? val : max, historicalData[0]),
        lowestMonth: historicalData.reduce((min, val) => val.count < min.count ? val : min, historicalData[0]),
      },
    };
  }
}
