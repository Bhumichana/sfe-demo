'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { managerApi } from '@/services/api';
import StatsCard from '@/components/dashboard/StatsCard';
import MainLayout from '@/components/layouts/MainLayout';

interface DashboardStats {
  totalCalls: number;
  todayCalls: number;
  monthCalls: number;
  pendingApprovals: number;
  totalTeamMembers: number;
  abcCoverage: {
    percentage: number;
    total: number;
    visited: number;
  };
  submittedReports: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user is a manager
    if (user?.role !== 'SUP' && user?.role !== 'SM' && user?.role !== 'PM' && user?.role !== 'MM') {
      router.push('/');
      return;
    }

    fetchDashboardStats();
  }, [isAuthenticated, user, router]);

  const fetchDashboardStats = async (customStartDate?: string, customEndDate?: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const params: { startDate?: string; endDate?: string } = {};
      if (customStartDate) params.startDate = customStartDate;
      if (customEndDate) params.endDate = customEndDate;

      const data = await managerApi.getDashboard(user.id, params);
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchDashboardStats(startDate, endDate);
    setShowDateFilter(false);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchDashboardStats();
    setShowDateFilter(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout
      title="Manager Dashboard"
      subtitle={`${user.fullName} - ${user.role}`}
      showBackButton={false}
    >
      {/* Welcome Banner */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/50"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="flex-1 text-white">
              <h2 className="text-xl font-bold drop-shadow-sm">ยินดีต้อนรับ!</h2>
              <p className="text-sm opacity-95 mt-0.5">
                {user.fullName} • {user.role}
              </p>
              {user.territory && (
                <p className="text-xs opacity-90 mt-1">
                  เขต: {user.territory.nameTh} ({user.territory.code})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Date Filter Section */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold text-foreground">Date Range Filter</h3>
              {(startDate || endDate) && (
                <span className="text-xs text-muted-foreground">
                  ({startDate || 'Any'} - {endDate || 'Any'})
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              {showDateFilter ? 'ซ่อน' : 'กรอง'}
            </button>
          </div>

          {showDateFilter && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  ใช้ Filter
                </button>
                <button
                  onClick={handleClearFilter}
                  className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ล้าง
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="รอ Approve"
                value={stats?.pendingApprovals || 0}
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                trend={undefined}
              />

              <StatsCard
                title="Calls วันนี้"
                value={stats?.todayCalls || 0}
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
                trend={undefined}
              />

              <StatsCard
                title="Calls เดือนนี้"
                value={stats?.monthCalls || 0}
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                trend={undefined}
              />

              <StatsCard
                title="ABC Coverage"
                value={`${stats?.abcCoverage?.percentage || 0}%`}
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                trend={undefined}
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Team Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Team Members</span>
                    <span className="text-2xl font-bold text-success">{stats?.totalTeamMembers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Submitted Reports</span>
                    <span className="text-2xl font-bold text-primary">{stats?.submittedReports || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Calls</span>
                    <span className="text-2xl font-bold text-foreground">{stats?.totalCalls || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">ABC Coverage Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Customers</span>
                    <span className="text-lg font-semibold text-foreground">{stats?.abcCoverage?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Visited</span>
                    <span className="text-lg font-semibold text-success">{stats?.abcCoverage?.visited || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-success h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${stats?.abcCoverage?.percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/approvals')}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary hover:bg-primary/5 transition-colors"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">Approve Plans</div>
                    <div className="text-sm text-muted-foreground">{stats?.pendingApprovals || 0} pending</div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/manager/team')}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary hover:bg-primary/5 transition-colors"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">View Team</div>
                    <div className="text-sm text-muted-foreground">{stats?.totalTeamMembers || 0} members</div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/manager/call-reports')}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary hover:bg-primary/5 transition-colors"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">Review Reports</div>
                    <div className="text-sm text-muted-foreground">{stats?.submittedReports || 0} reports</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
