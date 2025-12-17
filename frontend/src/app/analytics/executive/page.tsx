'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { analyticsApi } from '@/services/api';
import type { ExecutiveDashboardData } from '@/mocks/analytics-mock';
import MainLayout from '@/components/layouts/MainLayout';
import DateRangePicker from '@/components/DateRangePicker';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

// Import Chart Components
import SalesFunnelChart from '@/components/analytics/SalesFunnelChart';
import TerritoryComparisonChart from '@/components/analytics/TerritoryComparisonChart';
import CustomerSegmentationChart from '@/components/analytics/CustomerSegmentationChart';
import TrendAnalysisChart from '@/components/analytics/TrendAnalysisChart';
import PerformanceHeatmapChart from '@/components/analytics/PerformanceHeatmapChart';
import TeamComparisonRadarChart from '@/components/analytics/TeamComparisonRadarChart';

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default: last 30 days
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Check authentication and authorization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only SM and SD can access this page
    if (user && user.role !== 'SM' && user.role !== 'SD') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || (user.role !== 'SM' && user.role !== 'SD')) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await analyticsApi.getExecutiveDashboard({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setData(response);
      } catch (err: any) {
        console.error('Error fetching executive dashboard:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setLastUpdated(new Date());
  }, [user, dateRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (user && (user.role === 'SM' || user.role === 'SD')) {
        analyticsApi.getExecutiveDashboard({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }).then(response => {
          setData(response);
          setLastUpdated(new Date());
        }).catch(err => {
          console.error('Auto-refresh error:', err);
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, user, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Loading state
  if (loading || !user) {
    return (
      <MainLayout
        title="Executive Dashboard"
        subtitle="Deep analytics and insights"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-[400px] bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout
        title="Executive Dashboard"
        subtitle="Deep analytics and insights"
      >
        <div className="flex items-center justify-center py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Empty data state
  if (!data) {
    return (
      <MainLayout
        title="Executive Dashboard"
        subtitle="Deep analytics and insights"
      >
        <div className="flex items-center justify-center py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-gray-400 text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data</h2>
              <p className="text-gray-600">
                No analytics data available at the moment.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Executive Dashboard"
      subtitle={`Deep analytics for ${user.role === 'SM' ? 'Sales Manager' : 'Sales Director'}`}
    >
      {/* Controls: Date Range & Export Buttons */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {/* Export to PDF Button */}
          <button
            onClick={() => exportToPDF('dashboard-content', `executive-dashboard-${dateRange.startDate}-to-${dateRange.endDate}.pdf`)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to PDF"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={() => data && exportToExcel(data, `executive-dashboard-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`)}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to Excel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Auto-refresh Toggle */}
          <button
            onClick={handleAutoRefreshToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              autoRefresh
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
          >
            <svg
              className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">{autoRefresh ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Date Range Picker */}
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onApply={handleDateRangeChange}
          loading={loading}
        />
      </div>

      {/* Charts Grid - 2x2 on desktop, 1 column on mobile */}
      <div id="dashboard-content" className="space-y-6">
        {/* Primary Charts - 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* 1. Sales Funnel Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition">
            <SalesFunnelChart data={data.salesFunnel} loading={false} />
          </div>

          {/* 2. Territory Comparison Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition">
            <TerritoryComparisonChart data={data.territoryComparison} loading={false} />
          </div>

          {/* 3. Customer Segmentation Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition">
            <CustomerSegmentationChart data={data.customerSegmentation} loading={false} />
          </div>

          {/* 4. Trend Analysis Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition">
            <TrendAnalysisChart data={data.trendAnalysis} loading={false} />
          </div>
        </div>

        {/* Advanced Analytics - Full Width Charts */}
        <div className="space-y-4 md:space-y-6">
          {/* 5. Performance Heatmap */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition">
            <PerformanceHeatmapChart data={data.performanceHeatmap} loading={false} />
          </div>

          {/* 6. Team Comparison Radar */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition">
            <TeamComparisonRadarChart data={data.teamRadar} loading={false} />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 md:mt-8 text-center">
        <p className="text-xs md:text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
          {autoRefresh && (
            <span className="ml-2 inline-flex items-center text-blue-600">
              <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Auto-refreshing every 30s
            </span>
          )}
        </p>
      </div>
    </MainLayout>
  );
}
