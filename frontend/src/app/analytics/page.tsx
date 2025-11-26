'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import StatsCard from '@/components/dashboard/StatsCard';
import BottomNav from '@/components/BottomNav';

interface AnalyticsOverview {
  totalCalls: number;
  avgCallsPerDay: number;
  callsByType: Array<{
    type: string;
    activityType: string;
    count: number;
  }>;
  abcCoverage: {
    total: number;
    visited: number;
    percentage: number;
    breakdown: Array<{
      type: 'A' | 'B' | 'C';
      total: number;
      visited: number;
      percentage: number;
    }>;
  };
  topActivities: Array<{
    id: string;
    nameTh: string;
    nameEn: string;
    code: string;
    count: number;
  }>;
  totalSRs: number;
}

interface CallMetrics {
  totalCalls: number;
  plannedCalls: number;
  unplannedCalls: number;
  plannedPercentage: number;
  virtualCalls: number;
  faceToFaceCalls: number;
  avgDuration: number;
  callsByDay: Array<{
    day: string;
    count: number;
  }>;
  callsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

interface TeamPerformance {
  total: number;
  ranking: Array<{
    srId: string;
    srName: string;
    srEmail: string;
    territory: {
      code: string;
      nameTh: string;
    } | null;
    totalCalls: number;
    plannedCalls: number;
    plannedPercentage: number;
    abcCalls: {
      total: number;
      breakdown: {
        A: number;
        B: number;
        C: number;
      };
    };
    avgDuration: number;
    avgRating: number | null;
  }>;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [metrics, setMetrics] = useState<CallMetrics | null>(null);
  const [performance, setPerformance] = useState<TeamPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'performance'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'PM' && user?.role !== 'MM') {
      router.push('/');
      return;
    }

    fetchAnalytics();
  }, [isAuthenticated, user, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, metricsRes, performanceRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/overview?companyId=${user?.companyId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/call-metrics?companyId=${user?.companyId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/team-performance?companyId=${user?.companyId}`),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (performanceRes.ok) setPerformance(await performanceRes.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getCustomerTypeBadge = (type: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'bg-error/10 text-error',
      B: 'bg-warning/10 text-warning',
      C: 'bg-success/10 text-success',
    };
    return colors[type] || 'bg-gray-100 text-gray-500';
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-xs text-muted-foreground">{user.fullName} - {user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-error transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'metrics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Call Metrics
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'performance'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Team Performance
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="Total Calls"
                    value={overview.totalCalls}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                  <StatsCard
                    title="Avg Calls/Day"
                    value={overview.avgCallsPerDay.toFixed(1)}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                  <StatsCard
                    title="ABC Coverage"
                    value={`${overview.abcCoverage.percentage}%`}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                  <StatsCard
                    title="Total SRs"
                    value={overview.totalSRs}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                </div>

                {/* ABC Coverage Breakdown */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">ABC Coverage Breakdown</h3>
                  <div className="space-y-4">
                    {overview.abcCoverage.breakdown.map((item) => (
                      <div key={item.type}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCustomerTypeBadge(item.type)}`}>
                              Class {item.type}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {item.visited} / {item.total}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              item.type === 'A' ? 'bg-error' : item.type === 'B' ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Activities */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Activities</h3>
                  <div className="space-y-3">
                    {overview.topActivities.slice(0, 5).map((activity, index) => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </span>
                          <span className="text-sm text-foreground">{activity.nameTh}</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{activity.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="Planned Calls"
                    value={metrics.plannedCalls}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    }
                    trend={undefined}
                  />
                  <StatsCard
                    title="Unplanned Calls"
                    value={metrics.unplannedCalls}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                  <StatsCard
                    title="Face-to-Face"
                    value={metrics.faceToFaceCalls}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                  <StatsCard
                    title="Avg Duration"
                    value={`${metrics.avgDuration} min`}
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    trend={undefined}
                  />
                </div>

                {/* Planned Percentage */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Planned vs Unplanned
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Planned</span>
                        <span className="text-sm font-semibold text-success">
                          {metrics.plannedPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-success h-3 rounded-full transition-all duration-500"
                          style={{ width: `${metrics.plannedPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Unplanned</span>
                        <span className="text-sm font-semibold text-warning">
                          {(100 - metrics.plannedPercentage).toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-warning h-3 rounded-full transition-all duration-500"
                          style={{ width: `${100 - metrics.plannedPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calls by Month */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Calls by Month</h3>
                  <div className="space-y-3">
                    {metrics.callsByMonth.map((item) => (
                      <div key={item.month} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.month}</span>
                        <div className="flex items-center gap-3 flex-1 ml-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((item.count / metrics.totalCalls) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-foreground w-12 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && performance && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Team Ranking ({performance.total} SRs)
                  </h3>
                  <div className="space-y-4">
                    {performance.ranking.map((sr, index) => (
                      <div
                        key={sr.srId}
                        className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                              index === 0 ? 'bg-warning/20 text-warning' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-amber-700/20 text-amber-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              #{index + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground">{sr.srName}</div>
                              <div className="text-sm text-muted-foreground">{sr.srEmail}</div>
                              {sr.territory && (
                                <div className="text-xs text-muted-foreground">
                                  {sr.territory.code} - {sr.territory.nameTh}
                                </div>
                              )}
                            </div>
                          </div>
                          {sr.avgRating && (
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-semibold text-foreground">
                                {sr.avgRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">{sr.totalCalls}</div>
                            <div className="text-xs text-muted-foreground">Total Calls</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-success">{sr.plannedCalls}</div>
                            <div className="text-xs text-muted-foreground">Planned</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-primary">{sr.plannedPercentage}%</div>
                            <div className="text-xs text-muted-foreground">Planned %</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">{sr.abcCalls.total}</div>
                            <div className="text-xs text-muted-foreground">ABC Calls</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">{sr.avgDuration}</div>
                            <div className="text-xs text-muted-foreground">Avg Min</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm">
            <p>&copy; 2025 SFE Mobile. All rights reserved.</p>
            <p className="mt-1 text-gray-500">Sales Force Effectiveness Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
