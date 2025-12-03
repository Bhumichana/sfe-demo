'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActionButton from '@/components/dashboard/QuickActionButton';
import DailyTaskButton from '@/components/dashboard/DailyTaskButton';
import RecentCallItem, { RecentCall } from '@/components/dashboard/RecentCallItem';
import NotificationCenter from '@/components/NotificationCenter';
import BottomNav from '@/components/BottomNav';
import { preCallPlansApi, callReportsApi } from '@/services/api';
import { PreCallPlan } from '@/types';
import { format, startOfDay, startOfMonth } from 'date-fns';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout, initAuth } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [draftPlansCount, setDraftPlansCount] = useState(0);
  const [pendingPlansCount, setPendingPlansCount] = useState(0);
  const [todayCalls, setTodayCalls] = useState(0);
  const [monthCalls, setMonthCalls] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/notifications/user/${user.id}/unread-count`);
        const count = await response.json();
        setUnreadCount(typeof count === 'number' ? count : count.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch call reports statistics
  useEffect(() => {
    const fetchCallStats = async () => {
      if (!user) return;

      try {
        setLoadingStats(true);
        const reports = await callReportsApi.findByUser(user.id);

        // Calculate today's calls
        const today = startOfDay(new Date());
        const todayReports = reports.filter(report => {
          const callDate = startOfDay(new Date(report.callDate));
          return callDate.getTime() === today.getTime();
        });
        setTodayCalls(todayReports.length);

        // Calculate month's calls
        const monthStart = startOfMonth(new Date());
        const monthReports = reports.filter(report => {
          const callDate = new Date(report.callDate);
          return callDate >= monthStart;
        });
        setMonthCalls(monthReports.length);
      } catch (error) {
        console.error('Error fetching call stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchCallStats();
  }, [user]);

  // Fetch recent Pre-Call Plans and counts
  useEffect(() => {
    const fetchRecentCalls = async () => {
      if (!user) return;

      try {
        setLoadingCalls(true);
        const plans = await preCallPlansApi.findByUser(user.id);

        // Count plans by status
        const draftCount = plans.filter(plan => plan.status === 'DRAFT').length;
        const pendingCount = plans.filter(plan => plan.status === 'PENDING').length;

        setDraftPlansCount(draftCount);
        setPendingPlansCount(pendingCount);

        // Convert PreCallPlan to RecentCall format
        const calls: RecentCall[] = plans
          .filter(plan => plan.status === 'APPROVED') // Only show approved plans
          .slice(0, 5) // Get latest 5
          .map(plan => {
            const planDate = new Date(plan.planDate);
            return {
              id: plan.id,
              customerName: plan.customer?.name || 'ไม่ระบุลูกค้า',
              customerType: (plan.customer?.type || 'C') as 'A' | 'B' | 'C',
              status: 'approved' as const,
              date: planDate,
              time: format(planDate, 'HH:mm'),
              activities: plan.plannedActivities || [],
            };
          });

        setRecentCalls(calls);
      } catch (error) {
        console.error('Error fetching recent calls:', error);
      } finally {
        setLoadingCalls(false);
      }
    };

    fetchRecentCalls();
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect managers to manager dashboard
    const userRole = user?.role;
    if (userRole === 'SM' || userRole === 'SUP' || userRole === 'PM' || userRole === 'MM') {
      router.push('/manager/dashboard');
    }
  }, [isAuthenticated, user?.role, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SFE Mobile</h1>
                <p className="text-xs text-muted-foreground">Sales Force Effectiveness</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
                title="การแจ้งเตือน"
              >
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => router.push('/settings')}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                title="ตั้งค่า"
              >
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-error border border-error rounded-lg hover:bg-error/10 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Center */}
      {user && (
        <NotificationCenter
          userId={user.id}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full">
        {/* Welcome Section */}
        <div className="gradient-gold rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">ยินดีต้อนรับ!</h2>
              <p className="text-white/90 text-sm">{user.fullName} • {user.role}</p>
            </div>
          </div>
          {user.territory && (
            <p className="text-white/80 text-sm">
              เขต: {user.territory.nameTh} ({user.territory.code})
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Calls วันนี้"
            value={loadingStats ? "..." : todayCalls.toString()}
            subtitle="เป้าหมาย: 5 calls"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="primary"
          />

          <StatsCard
            title="ABC Coverage %"
            value="85%"
            subtitle="A: 90% • B: 85% • C: 80%"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="success"
          />

          <StatsCard
            title="Calls เดือนนี้"
            value={loadingStats ? "..." : monthCalls.toString()}
            subtitle="จาก 100 calls"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="info"
          />

          <StatsCard
            title="รอ Approve"
            value={pendingPlansCount.toString()}
            subtitle="รออนุมัติจากผู้จัดการ"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="warning"
          />
        </div>

        {/* Quick Actions */}
        <section className="bg-gradient-to-r from-violet-500 to-blue-500 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h3 className="text-lg font-bold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/check-in')}
              className="bg-white/90 hover:bg-white backdrop-blur-sm border-2 border-white rounded-xl p-6 shadow-xl transition-all flex flex-col items-center gap-3 min-h-[140px]"
            >
              <div className="w-12 h-12">
                <svg className="w-full h-full text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-violet-700">Check-in Now</span>
            </button>

            <button
              onClick={() => router.push('/quick-photo')}
              className="bg-white/90 hover:bg-white backdrop-blur-sm border-2 border-white rounded-xl p-6 shadow-xl transition-all flex flex-col items-center gap-3 min-h-[140px]"
            >
              <div className="w-12 h-12">
                <svg className="w-full h-full text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-blue-700">Quick Photo</span>
            </button>
          </div>
        </section>

        {/* งานประจำวัน (Daily Tasks) */}
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">งานประจำวัน</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <DailyTaskButton
              title="Pre-Call Plan"
              titleEn="วางแผนการเยี่ยมเยียน"
              icon="📝"
              badge={draftPlansCount > 0 ? draftPlansCount : undefined}
              onClick={() => router.push('/pre-call-plans')}
            />

            <DailyTaskButton
              title="Call Report"
              titleEn="รายงานการเยี่ยมเยียน"
              icon="📋"
              onClick={() => router.push('/call-reports')}
            />

            <DailyTaskButton
              title="Calendar"
              titleEn="ดูปฏิทิน"
              icon="📅"
              onClick={() => alert('Calendar coming soon!')}
            />

            <DailyTaskButton
              title="My Reports (Analytics)"
              titleEn="รายงานของฉัน"
              icon="📊"
              onClick={() => router.push('/reports')}
            />
          </div>
        </section>

        {/* Recent Calls */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Recent Calls</h3>
            <button
              onClick={() => router.push('/pre-call-plans')}
              className="text-sm text-primary hover:underline font-medium"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <div className="space-y-3">
            {loadingCalls ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentCalls.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-border p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  ยังไม่มีแผนที่ได้รับอนุมัติ
                </h3>
                <p className="text-sm text-gray-500">
                  สร้าง Pre-Call Plan และส่งอนุมัติเพื่อเริ่มต้นการทำงาน
                </p>
              </div>
            ) : (
              recentCalls.map((call) => (
                <RecentCallItem
                  key={call.id}
                  call={call}
                  onClick={() => router.push(`/pre-call-plans`)}
                />
              ))
            )}
          </div>
        </section>

        {/* Help Section */}
        <div className="bg-info/10 border border-info rounded-xl p-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-info flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-info mb-1">ต้องการความช่วยเหลือ?</h4>
              <p className="text-sm text-info/80 mb-2">
                หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อ IT Support หรือผู้จัดการของคุณ
              </p>
              <button className="text-sm text-info hover:underline font-medium">
                ติดต่อ Support →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-auto mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            SFE Mobile v1.0.0 • 2025 • Built with Next.js + NestJS
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
