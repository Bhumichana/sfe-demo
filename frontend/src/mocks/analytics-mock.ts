/**
 * Mock Data for Deep Analytics Dashboard
 * Structure matches the actual API response from GET /analytics/executive-dashboard
 * Used for developing and testing chart components
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SalesFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface SalesFunnelData {
  funnel: SalesFunnelStage[];
  metrics: {
    leadConversionRate: number;
    opportunityConversionRate: number;
    winRate: number;
    avgDealCycle: number;
  };
}

export interface TerritoryData {
  territoryId: string;
  territoryCode: string;
  territoryName: string;
  totalCalls: number;
  teamSize: number;
  avgCallsPerSR: number;
  abcCoverage: number;
}

export interface TerritoryComparisonData {
  total: number;
  territories: TerritoryData[];
}

export interface CustomerSegmentData {
  type: string;
  count: number;
  percentage: number;
}

export interface GeoDistributionData {
  territoryId: string;
  territoryName: string;
  territoryCode: string;
  count: number;
  percentage: number;
}

export interface CustomerSegmentationData {
  totalCustomers: number;
  abcDistribution: CustomerSegmentData[];
  geoDistribution: GeoDistributionData[];
  visitFrequency: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export interface TrendDataPoint {
  month: string;
  count: number;
  date?: string;
  growthRate?: number;
  isForecast?: boolean;
}

export interface TrendAnalysisData {
  historical: TrendDataPoint[];
  forecast: TrendDataPoint[];
  trendDirection: 'up' | 'down' | 'stable';
  summary: {
    totalCalls: number;
    avgPerMonth: number;
    highestMonth: TrendDataPoint;
    lowestMonth: TrendDataPoint;
  };
}

export interface HeatmapData {
  day: string;
  territories: {
    [key: string]: number;
  };
}

export interface PerformanceHeatmapData {
  heatmapData: HeatmapData[];
  territoryList: string[];
}

export interface RadarDataPoint {
  metric: string;
  [key: string]: string | number;
}

export interface TeamRadarData {
  radarData: RadarDataPoint[];
  teams: string[];
}

export interface ExecutiveDashboardData {
  salesFunnel: SalesFunnelData;
  territoryComparison: TerritoryComparisonData;
  customerSegmentation: CustomerSegmentationData;
  trendAnalysis: TrendAnalysisData;
  performanceHeatmap: PerformanceHeatmapData;
  teamRadar: TeamRadarData;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

// ============================================
// MOCK DATA
// ============================================

export const mockSalesFunnelData: SalesFunnelData = {
  funnel: [
    { stage: 'Prospects', count: 450, percentage: 100 },
    { stage: 'Leads', count: 280, percentage: 62.2 },
    { stage: 'Opportunities', count: 125, percentage: 27.8 },
    { stage: 'Wins', count: 45, percentage: 10 },
  ],
  metrics: {
    leadConversionRate: 62.2,
    opportunityConversionRate: 44.6,
    winRate: 36,
    avgDealCycle: 28.5,
  },
};

export const mockTerritoryComparisonData: TerritoryComparisonData = {
  total: 7,
  territories: [
    {
      territoryId: '1',
      territoryCode: 'BKK1',
      territoryName: 'กรุงเทพฯ เขตเหนือ',
      totalCalls: 342,
      teamSize: 8,
      avgCallsPerSR: 42.8,
      abcCoverage: 87.5,
    },
    {
      territoryId: '2',
      territoryCode: 'BKK2',
      territoryName: 'กรุงเทพฯ เขตใต้',
      totalCalls: 298,
      teamSize: 7,
      avgCallsPerSR: 42.6,
      abcCoverage: 82.3,
    },
    {
      territoryId: '3',
      territoryCode: 'BKK3',
      territoryName: 'กรุงเทพฯ เขตตะวันออก',
      totalCalls: 256,
      teamSize: 6,
      avgCallsPerSR: 42.7,
      abcCoverage: 78.9,
    },
    {
      territoryId: '4',
      territoryCode: 'BKK4',
      territoryName: 'กรุงเทพฯ เขตตะวันตก',
      totalCalls: 189,
      teamSize: 5,
      avgCallsPerSR: 37.8,
      abcCoverage: 71.2,
    },
    {
      territoryId: '5',
      territoryCode: 'CT1',
      territoryName: 'นนทบุรี + ปทุมธานี',
      totalCalls: 167,
      teamSize: 4,
      avgCallsPerSR: 41.8,
      abcCoverage: 69.5,
    },
    {
      territoryId: '6',
      territoryCode: 'CT2',
      territoryName: 'สมุทรปราการ + สมุทรสาคร',
      totalCalls: 145,
      teamSize: 4,
      avgCallsPerSR: 36.3,
      abcCoverage: 65.8,
    },
    {
      territoryId: '7',
      territoryCode: 'N1',
      territoryName: 'เชียงใหม่ + ลำพูน',
      totalCalls: 123,
      teamSize: 3,
      avgCallsPerSR: 41,
      abcCoverage: 62.4,
    },
  ],
};

export const mockCustomerSegmentationData: CustomerSegmentationData = {
  totalCustomers: 458,
  abcDistribution: [
    { type: 'A', count: 85, percentage: 18.6 },
    { type: 'B', count: 167, percentage: 36.5 },
    { type: 'C', count: 206, percentage: 44.9 },
  ],
  geoDistribution: [
    {
      territoryId: '1',
      territoryName: 'กรุงเทพฯ เขตเหนือ',
      territoryCode: 'BKK1',
      count: 112,
      percentage: 24.5,
    },
    {
      territoryId: '2',
      territoryName: 'กรุงเทพฯ เขตใต้',
      territoryCode: 'BKK2',
      count: 98,
      percentage: 21.4,
    },
    {
      territoryId: '3',
      territoryName: 'กรุงเทพฯ เขตตะวันออก',
      territoryCode: 'BKK3',
      count: 87,
      percentage: 19,
    },
    {
      territoryId: '4',
      territoryName: 'กรุงเทพฯ เขตตะวันตก',
      territoryCode: 'BKK4',
      count: 65,
      percentage: 14.2,
    },
    {
      territoryId: '5',
      territoryName: 'นนทบุรี + ปทุมธานี',
      territoryCode: 'CT1',
      count: 54,
      percentage: 11.8,
    },
    {
      territoryId: '6',
      territoryName: 'สมุทรปราการ + สมุทรสาคร',
      territoryCode: 'CT2',
      count: 42,
      percentage: 9.2,
    },
  ],
  visitFrequency: {
    high: 125,
    medium: 218,
    low: 115,
    total: 458,
  },
};

export const mockTrendAnalysisData: TrendAnalysisData = {
  historical: [
    { month: 'Jul 2025', count: 245, date: '2025-07-01', growthRate: 0 },
    { month: 'Aug 2025', count: 268, date: '2025-08-01', growthRate: 9.4 },
    { month: 'Sep 2025', count: 289, date: '2025-09-01', growthRate: 7.8 },
    { month: 'Oct 2025', count: 312, date: '2025-10-01', growthRate: 8 },
    { month: 'Nov 2025', count: 298, date: '2025-11-01', growthRate: -4.5 },
    { month: 'Dec 2025', count: 325, date: '2025-12-01', growthRate: 9.1 },
  ],
  forecast: [
    { month: 'Jan 2026', count: 342, isForecast: true },
    { month: 'Feb 2026', count: 358, isForecast: true },
    { month: 'Mar 2026', count: 371, isForecast: true },
  ],
  trendDirection: 'up',
  summary: {
    totalCalls: 1737,
    avgPerMonth: 289.5,
    highestMonth: { month: 'Dec 2025', count: 325, date: '2025-12-01' },
    lowestMonth: { month: 'Jul 2025', count: 245, date: '2025-07-01' },
  },
};

export const mockPerformanceHeatmapData: PerformanceHeatmapData = {
  heatmapData: [
    {
      day: 'Mon',
      territories: {
        'BKK01': 65,
        'BKK02': 58,
        'BKK03': 72,
        'NT01': 45,
        'NT02': 52,
        'CT1': 38,
        'CT2': 41,
      },
    },
    {
      day: 'Tue',
      territories: {
        'BKK01': 72,
        'BKK02': 68,
        'BKK03': 75,
        'NT01': 52,
        'NT02': 58,
        'CT1': 42,
        'CT2': 45,
      },
    },
    {
      day: 'Wed',
      territories: {
        'BKK01': 78,
        'BKK02': 72,
        'BKK03': 82,
        'NT01': 58,
        'NT02': 62,
        'CT1': 48,
        'CT2': 52,
      },
    },
    {
      day: 'Thu',
      territories: {
        'BKK01': 85,
        'BKK02': 78,
        'BKK03': 88,
        'NT01': 62,
        'NT02': 68,
        'CT1': 52,
        'CT2': 58,
      },
    },
    {
      day: 'Fri',
      territories: {
        'BKK01': 68,
        'BKK02': 62,
        'BKK03': 72,
        'NT01': 48,
        'NT02': 55,
        'CT1': 45,
        'CT2': 48,
      },
    },
  ],
  territoryList: ['BKK01', 'BKK02', 'BKK03', 'NT01', 'NT02', 'CT1', 'CT2'],
};

export const mockTeamRadarData: TeamRadarData = {
  radarData: [
    {
      metric: 'Call Volume',
      'Team A': 85,
      'Team B': 72,
      'Team C': 68,
      'Team D': 78,
      'Team E': 65,
    },
    {
      metric: 'ABC Coverage',
      'Team A': 78,
      'Team B': 82,
      'Team C': 75,
      'Team D': 72,
      'Team E': 68,
    },
    {
      metric: 'Conversion Rate',
      'Team A': 72,
      'Team B': 68,
      'Team C': 85,
      'Team D': 75,
      'Team E': 70,
    },
    {
      metric: 'Customer Satisfaction',
      'Team A': 88,
      'Team B': 85,
      'Team C': 78,
      'Team D': 82,
      'Team E': 75,
    },
    {
      metric: 'Response Time',
      'Team A': 75,
      'Team B': 78,
      'Team C': 72,
      'Team D': 85,
      'Team E': 68,
    },
    {
      metric: 'Team Efficiency',
      'Team A': 82,
      'Team B': 75,
      'Team C': 78,
      'Team D': 72,
      'Team E': 80,
    },
  ],
  teams: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
};

/**
 * Complete Executive Dashboard Mock Response
 * This structure exactly matches the API response from:
 * GET /analytics/executive-dashboard
 */
export const mockExecutiveDashboardData: ExecutiveDashboardData = {
  salesFunnel: mockSalesFunnelData,
  territoryComparison: mockTerritoryComparisonData,
  customerSegmentation: mockCustomerSegmentationData,
  trendAnalysis: mockTrendAnalysisData,
  performanceHeatmap: mockPerformanceHeatmapData,
  teamRadar: mockTeamRadarData,
  dateRange: {
    startDate: '2025-07-01',
    endDate: '2025-12-31',
  },
};
