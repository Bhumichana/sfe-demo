'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi } from '@/services/api';
import { PreCallPlan, PlanStatus } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

const STATUS_COLORS: Record<PlanStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-700 border-green-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่อนุมัติ',
};

export default function PreCallPlansPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<PreCallPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PlanStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadPlans();
  }, [isAuthenticated, filter, user]);

  const loadPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await preCallPlansApi.findByUser(
        user.id,
        filter === 'ALL' ? undefined : filter
      );
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!user || !confirm('คุณต้องการลบแผนนี้ใช่หรือไม่?')) return;

    try {
      await preCallPlansApi.remove(planId, user.id);
      alert('ลบแผนสำเร็จ');
      loadPlans();
    } catch (error: any) {
      console.error('Failed to delete plan:', error);
      alert(error.response?.data?.message || 'ไม่สามารถลบแผนได้');
    }
  };

  const handleSubmit = async (planId: string) => {
    if (!user || !confirm('คุณต้องการส่งแผนนี้เพื่ออนุมัติใช่หรือไม่?')) return;

    try {
      console.log('📤 Submitting plan:', { planId, userId: user.id });
      await preCallPlansApi.submit(planId, user.id);
      alert('ส่งแผนเพื่ออนุมัติสำเร็จ');
      loadPlans();
    } catch (error: any) {
      console.error('❌ Failed to submit plan:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      alert(error.response?.data?.message || 'ไม่สามารถส่งแผนได้');
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
    ALL: plans.length,
    DRAFT: plans.filter((p) => p.status === 'DRAFT').length,
    PENDING: plans.filter((p) => p.status === 'PENDING').length,
    APPROVED: plans.filter((p) => p.status === 'APPROVED').length,
    REJECTED: plans.filter((p) => p.status === 'REJECTED').length,
  };

  return (
    <MainLayout title="Pre-Call Plans" subtitle="วางแผนการเยี่ยมเยียน" showBackButton={true}>
      <div className="space-y-6">
        {/* Create Plan Button */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/pre-call-plans/create')}
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
            สร้างแผนใหม่
          </button>
        </div>
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-4">
          <div className="flex gap-2 overflow-x-auto">
            {(['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(
              (status) => (
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
              )
            )}
          </div>
        </div>

        {/* Plans List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : plans.length === 0 ? (
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
              ยังไม่มีแผนการเยี่ยมเยียน
            </h3>
            <p className="text-gray-500 mb-6">
              เริ่มสร้างแผนการเยี่ยมเยียนของคุณได้เลย
            </p>
            <button
              onClick={() => router.push('/pre-call-plans/create')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              สร้างแผนใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {plan.customer?.name || 'ไม่ระบุลูกค้า'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          STATUS_COLORS[plan.status]
                        }`}
                      >
                        {STATUS_LABELS[plan.status]}
                      </span>
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
                          {format(new Date(plan.planDate), 'dd MMMM yyyy HH:mm น.', {
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
                        <span>{plan.contact?.name || 'ไม่ระบุผู้ติดต่อ'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {plan.objectives && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      วัตถุประสงค์:
                    </h4>
                    <p className="text-sm text-muted-foreground">{plan.objectives}</p>
                  </div>
                )}

                {plan.rejectionReason && plan.status === 'REJECTED' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-700 mb-1">
                      เหตุผลที่ไม่อนุมัติ:
                    </h4>
                    <p className="text-sm text-red-600">{plan.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => router.push(`/pre-call-plans/${plan.id}`)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    ดูรายละเอียด
                  </button>

                  {plan.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => router.push(`/pre-call-plans/${plan.id}/edit`)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleSubmit(plan.id)}
                        className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm"
                      >
                        ส่งอนุมัติ
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
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
