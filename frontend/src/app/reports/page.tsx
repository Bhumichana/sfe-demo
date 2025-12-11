'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { callReportsApi } from '@/services/api';
import MainLayout from '@/components/layouts/MainLayout';
import { format, startOfMonth, startOfToday, subDays } from 'date-fns';

interface CallReport {
  id: string;
  srId: string;
  customerId: string;
  customer?: {
    code: string;
    name: string;
    type: string;
  };
  callDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  activitiesDone: string[];
  status: string;
}

interface DailyCallCount {
  date: string;
  count: number;
}

// Helper function to get customer type name
const getCustomerTypeName = (type: string): string => {
  switch (type) {
    case 'A':
      return 'ลูกค้า A (VIP)';
    case 'B':
      return 'ลูกค้า B (สำคัญ)';
    case 'C':
      return 'ลูกค้า C (ทั่วไป)';
    default:
      return '-';
  }
};

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [callReports, setCallReports] = useState<CallReport[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    monthCalls: 0,
    todayCalls: 0,
    avgCallsPerDay: 0,
    abcCoverage: {
      A: 0,
      B: 0,
      C: 0,
    },
  });
  const [dailyCalls, setDailyCalls] = useState<DailyCallCount[]>([]);
  const [activityBreakdown, setActivityBreakdown] = useState<{ activity: string; count: number }[]>([]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      fetchReportsData();
    }
  }, [isAuthenticated, user, router]);

  const fetchReportsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all call reports based on user role (Backend handles filtering)
      // SR: sees own reports only
      // SUP: sees own + subordinates' reports
      // SM/SD: sees all reports
      const reports = await callReportsApi.findAll();
      setCallReports(reports);

      // Calculate stats
      const today = startOfToday();
      const monthStart = startOfMonth(today);

      const todayReports = reports.filter(r => {
        const callDate = new Date(r.callDate);
        return format(callDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      });

      const monthReports = reports.filter(r => {
        const callDate = new Date(r.callDate);
        return callDate >= monthStart;
      });

      // ABC Coverage
      const abcCount = { A: 0, B: 0, C: 0 };
      const abcTotal = { A: 0, B: 0, C: 0 };
      reports.forEach(r => {
        const type = r.customer?.type || '';
        if (type in abcCount) {
          abcCount[type as 'A' | 'B' | 'C']++;
        }
      });

      // Calculate daily calls for last 7 days
      const last7Days: DailyCallCount[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = reports.filter(r =>
          format(new Date(r.callDate), 'yyyy-MM-dd') === dateStr
        ).length;
        last7Days.push({
          date: format(date, 'dd/MM'),
          count,
        });
      }
      setDailyCalls(last7Days);

      // Activity breakdown
      const activityMap = new Map<string, number>();
      reports.forEach(r => {
        r.activitiesDone.forEach(activity => {
          activityMap.set(activity, (activityMap.get(activity) || 0) + 1);
        });
      });
      const activities = Array.from(activityMap.entries())
        .map(([activity, count]) => ({ activity, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setActivityBreakdown(activities);

      setStats({
        totalCalls: reports.length,
        monthCalls: monthReports.length,
        todayCalls: todayReports.length,
        avgCallsPerDay: monthReports.length > 0 ? Math.round(monthReports.length / new Date().getDate()) : 0,
        abcCoverage: {
          A: reports.length > 0 ? Math.round((abcCount.A / reports.length) * 100) : 0,
          B: reports.length > 0 ? Math.round((abcCount.B / reports.length) * 100) : 0,
          C: reports.length > 0 ? Math.round((abcCount.C / reports.length) * 100) : 0,
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (callReports.length === 0) {
      alert('ไม่มีข้อมูลสำหรับ Export');
      return;
    }

    const headers = ['วันที่', 'รหัสลูกค้า', 'ชื่อลูกค้า', 'ประเภท', 'กิจกรรม', 'สถานะ'];
    const rows = callReports.map(report => [
      format(new Date(report.callDate), 'dd/MM/yyyy'),
      report.customer?.code || '-',
      report.customer?.name || '-',
      getCustomerTypeName(report.customer?.type || ''),
      report.activitiesDone.join(', '),
      report.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <MainLayout
        title={user?.role === 'SR' ? 'My Reports (Analytics)' : 'Team Reports (Analytics)'}
        subtitle="ภาพรวมและวิเคราะห์ผลงาน"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const maxDailyCalls = Math.max(...dailyCalls.map(d => d.count), 1);

  return (
    <MainLayout
      title={user?.role === 'SR' ? 'My Reports (Analytics)' : 'Team Reports (Analytics)'}
      subtitle="ภาพรวมและวิเคราะห์ผลงาน"
    >
      <div className="space-y-6">
        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">Export CSV</span>
          </button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">วันนี้</p>
                <p className="text-2xl font-bold text-primary">{stats.todayCalls}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Calls วันนี้</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">เดือนนี้</p>
                <p className="text-2xl font-bold text-warning">{stats.monthCalls}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Calls เดือนนี้</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                <p className="text-2xl font-bold text-success">{stats.totalCalls}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Calls ทั้งหมด</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">เฉลี่ย</p>
                <p className="text-2xl font-bold text-info">{stats.avgCallsPerDay}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Calls/วัน</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Calls Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Call Trends (7 วันล่าสุด)</h3>
            <div className="space-y-2">
              {dailyCalls.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-muted-foreground">{day.date}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(day.count / maxDailyCalls) * 100}%` }}
                    >
                      {day.count > 0 && (
                        <span className="text-xs font-semibold text-white">{day.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">กิจกรรมที่ทำบ่อย (Top 5)</h3>
            <div className="space-y-3">
              {activityBreakdown.length > 0 ? (
                activityBreakdown.map((item, index) => {
                  const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-purple-500'];
                  const maxCount = activityBreakdown[0].count;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{item.activity}</span>
                        <span className="text-sm font-semibold text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูลกิจกรรม</p>
              )}
            </div>
          </div>
        </div>

        {/* ABC Coverage */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">ABC Coverage</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-error/5 rounded-lg border-2 border-error/20">
              <div className="text-3xl font-bold text-error mb-1">{stats.abcCoverage.A}%</div>
              <div className="text-sm text-muted-foreground">ลูกค้า A</div>
            </div>
            <div className="text-center p-4 bg-warning/5 rounded-lg border-2 border-warning/20">
              <div className="text-3xl font-bold text-warning mb-1">{stats.abcCoverage.B}%</div>
              <div className="text-sm text-muted-foreground">ลูกค้า B</div>
            </div>
            <div className="text-center p-4 bg-success/5 rounded-lg border-2 border-success/20">
              <div className="text-3xl font-bold text-success mb-1">{stats.abcCoverage.C}%</div>
              <div className="text-sm text-muted-foreground">ลูกค้า C</div>
            </div>
          </div>
        </div>

        {/* Recent Call Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">รายงานล่าสุด (10 รายการ)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">วันที่</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">ประเภท</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">กิจกรรม</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {callReports.slice(0, 10).map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">
                      {format(new Date(report.callDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">{report.customer?.name || '-'}</div>
                      <div className="text-xs text-muted-foreground">{report.customer?.code || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        report.customer?.type === 'A' ? 'bg-error/10 text-error' :
                        report.customer?.type === 'B' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        {getCustomerTypeName(report.customer?.type || '')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {report.activitiesDone.slice(0, 2).join(', ')}
                      {report.activitiesDone.length > 2 && '...'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'SUBMITTED' ? 'bg-success/10 text-success' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {report.status === 'SUBMITTED' ? 'ส่งแล้ว' : report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {callReports.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-muted-foreground">ยังไม่มีรายงาน</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
