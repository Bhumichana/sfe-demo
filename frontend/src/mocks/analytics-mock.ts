/**
 * Mock data for Deep Analytics Testing
 * Use this data to test Charts without calling real API
 */

export const mockSalesFunnel = {
  funnel: [
    { stage: 'Prospects', count: 500, percentage: 100 },
    { stage: 'Leads', count: 250, percentage: 50 },
    { stage: 'Opportunities', count: 100, percentage: 40 },
    { stage: 'Wins', count: 35, percentage: 35 },
  ],
  metrics: {
    leadConversionRate: 50,
    opportunityConversionRate: 40,
    winRate: 35,
    avgDealCycle: 14,
  },
};

export const mockTerritoryComparison = [
  {
    territoryCode: 'BKK-01',
    territoryName: 'กรุงเทพฯ เขต 1',
    totalCalls: 450,
    completedCalls: 380,
    avgCallDuration: 25,
    srCount: 12,
    totalRevenue: 1250000,
  },
  {
    territoryCode: 'BKK-02',
    territoryName: 'กรุงเทพฯ เขต 2',
    totalCalls: 380,
    completedCalls: 320,
    avgCallDuration: 22,
    srCount: 10,
    totalRevenue: 980000,
  },
  {
    territoryCode: 'CNX-01',
    territoryName: 'เชียงใหม่',
    totalCalls: 280,
    completedCalls: 240,
    avgCallDuration: 28,
    srCount: 8,
    totalRevenue: 750000,
  },
  {
    territoryCode: 'PKT-01',
    territoryName: 'ภูเก็ต',
    totalCalls: 220,
    completedCalls: 190,
    avgCallDuration: 24,
    srCount: 6,
    totalRevenue: 620000,
  },
  {
    territoryCode: 'KKN-01',
    territoryName: 'ขอนแก่น',
    totalCalls: 310,
    completedCalls: 270,
    avgCallDuration: 26,
    srCount: 9,
    totalRevenue: 850000,
  },
];

export const mockCustomerSegmentation = {
  segments: [
    { segment: 'A', count: 120, percentage: 24, revenue: 3500000 },
    { segment: 'B', count: 180, percentage: 36, revenue: 2100000 },
    { segment: 'C', count: 200, percentage: 40, revenue: 900000 },
  ],
  total: 500,
  totalRevenue: 6500000,
};

export const mockTrendAnalysis = {
  trends: [
    { month: '2025-01', actual: 450, forecast: 460, target: 500 },
    { month: '2025-02', actual: 480, forecast: 490, target: 500 },
    { month: '2025-03', actual: 510, forecast: 520, target: 500 },
    { month: '2025-04', actual: 490, forecast: 500, target: 500 },
    { month: '2025-05', actual: 520, forecast: 530, target: 550 },
    { month: '2025-06', actual: 540, forecast: 550, target: 550 },
    { month: '2025-07', actual: null, forecast: 560, target: 550 }, // Future forecast
    { month: '2025-08', actual: null, forecast: 580, target: 600 },
    { month: '2025-09', actual: null, forecast: 595, target: 600 },
  ],
  summary: {
    avgGrowthRate: 5.2,
    forecastAccuracy: 92.5,
    nextMonthForecast: 560,
  },
};

/**
 * Complete Executive Dashboard Mock Response
 * This matches the actual API response structure
 */
export const mockExecutiveDashboard = {
  salesFunnel: mockSalesFunnel,
  territoryComparison: mockTerritoryComparison,
  customerSegmentation: mockCustomerSegmentation,
  trendAnalysis: mockTrendAnalysis,
  dateRange: {
    startDate: '2025-01-01',
    endDate: '2025-06-30',
  },
};
