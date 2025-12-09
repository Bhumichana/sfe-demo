'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { callReportsApi } from '@/services/api';
import { CallReport, CallReportStatus } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

const STATUS_COLORS: Record<CallReportStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  SUBMITTED: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_LABELS: Record<CallReportStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  SUBMITTED: 'ส่งแล้ว',
};

export default function CallReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [reports, setReports] = useState<CallReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CallReportStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadReports();
  }, [isAuthenticated, filter, user]);

  const loadReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await callReportsApi.findByUser(
        user.id,
        filter === 'ALL' ? undefined : filter
      );
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!user || !confirm('คุณต้องการลบรายงานนี้ใช่หรือไม่?')) return;

    try {
      await callReportsApi.remove(reportId, user.id);
      alert('ลบรายงานสำเร็จ');
      loadReports();
    } catch (error: any) {
      console.error('Failed to delete report:', error);
      alert(error.response?.data?.message || 'ไม่สามารถลบรายงานได้');
    }
  };

  const handleSubmit = async (reportId: string) => {
    if (!user || !confirm('คุณต้องการส่งรายงานนี้ใช่หรือไม่?')) return;

    try {
      await callReportsApi.submit(reportId, user.id);
      alert('ส่งรายงานสำเร็จ');
      loadReports();
    } catch (error: any) {
      console.error('Failed to submit report:', error);
      alert(error.response?.data?.message || 'ไม่สามารถส่งรายงานได้');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredCount = {
    ALL: reports.length,
    DRAFT: reports.filter((r) => r.status === 'DRAFT').length,
    SUBMITTED: reports.filter((r) => r.status === 'SUBMITTED').length,
  };

  return (
    <MainLayout title="Call Reports" subtitle="รายงานการเยี่ยมเยียน" showBackButton={true}>
      <div className="space-y-6">
        {/* Create Report Button */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/call-reports/create')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center gap-2 shadow-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            สร้างรายงานใหม่
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-4">
          <div className="flex gap-2 overflow-x-auto">
            {(['ALL', 'DRAFT', 'SUBMITTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'ทั้งหมด' : STATUS_LABELS[status]} (
                {filteredCount[status]})
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ยังไม่มีรายงานการเยี่ยมเยียน
            </h3>
            <p className="text-gray-500 mb-6">
              เริ่มสร้างรายงานการเยี่ยมเยียนของคุณได้เลย
            </p>
            <button
              onClick={() => router.push('/call-reports/create')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              สร้างรายงานใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {report.customer?.name || 'ไม่ระบุลูกค้า'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          STATUS_COLORS[report.status]
                        }`}
                      >
                        {STATUS_LABELS[report.status]}
                      </span>
                      {report.isPlanned && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          ตามแผน
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {format(new Date(report.callDate), 'dd MMMM yyyy HH:mm น.', {
                            locale: th,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>{report.contact?.name || 'ไม่ระบุผู้ติดต่อ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {report.callActivityType === 'VIRTUAL' ? 'Virtual' : 'พบหน้า'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {report.activitiesDone && report.activitiesDone.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      กิจกรรมที่ทำ:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {report.activitiesDone.join(', ')}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => router.push(`/call-reports/${report.id}`)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    ดูรายละเอียด
                  </button>

                  {report.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => router.push(`/call-reports/${report.id}/edit`)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleSubmit(report.id)}
                        className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm"
                      >
                        ส่งรายงาน
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                      >
                        ลบ
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
