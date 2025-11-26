'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function PreCallPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const [plan, setPlan] = useState<PreCallPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (planId) {
      loadPlan();
    }
  }, [isAuthenticated, planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await preCallPlansApi.findOne(planId);
      setPlan(data);
    } catch (error) {
      console.error('Failed to load plan:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      router.push('/pre-call-plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !plan || !confirm('คุณต้องการลบแผนนี้ใช่หรือไม่?')) return;

    try {
      await preCallPlansApi.remove(plan.id, user.id);
      alert('ลบแผนสำเร็จ');
      router.push('/pre-call-plans');
    } catch (error: any) {
      console.error('Failed to delete plan:', error);
      alert(error.response?.data?.message || 'ไม่สามารถลบแผนได้');
    }
  };

  const handleSubmit = async () => {
    if (!user || !plan || !confirm('คุณต้องการส่งแผนนี้เพื่ออนุมัติใช่หรือไม่?'))
      return;

    try {
      await preCallPlansApi.submit(plan.id, user.id);
      alert('ส่งแผนเพื่ออนุมัติสำเร็จ');
      loadPlan(); // Reload to get updated status
    } catch (error: any) {
      console.error('Failed to submit plan:', error);
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

  if (loading) {
    return (
      <MainLayout title="รายละเอียดแผนการเยี่ยมเยียน" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout title="ไม่พบข้อมูล" showBackButton={true}>
        <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            ไม่พบข้อมูลแผนการเยี่ยมเยียน
          </h3>
          <button
            onClick={() => router.push('/pre-call-plans')}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="รายละเอียดแผนการเยี่ยมเยียน" showBackButton={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Status */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {plan.customer?.name || 'ไม่ระบุลูกค้า'}
              </h2>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                  STATUS_COLORS[plan.status]
                }`}
              >
                {STATUS_LABELS[plan.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6">
          {/* Date and Time */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              วันที่และเวลา
            </h3>
            <div className="flex items-center gap-2 text-foreground">
              <svg
                className="w-5 h-5 text-gray-400"
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
              <span className="text-lg">
                {format(new Date(plan.planDate), 'dd MMMM yyyy HH:mm น.', {
                  locale: th,
                })}
              </span>
            </div>
          </div>

          {/* Contact Person */}
          {plan.contact && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                ผู้ติดต่อ
              </h3>
              <div className="flex items-center gap-2 text-foreground">
                <svg
                  className="w-5 h-5 text-gray-400"
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
                <span className="text-lg">{plan.contact.name}</span>
              </div>
            </div>
          )}

          {/* Objectives */}
          {plan.objectives && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                วัตถุประสงค์
              </h3>
              <p className="text-foreground text-base leading-relaxed">
                {plan.objectives}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {plan.rejectionReason && plan.status === 'REJECTED' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-700 mb-2">
                เหตุผลที่ไม่อนุมัติ
              </h3>
              <p className="text-red-600">{plan.rejectionReason}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-border space-y-2 text-sm text-gray-500">
            {plan.createdAt && (
              <div>
                สร้างเมื่อ:{' '}
                {format(new Date(plan.createdAt), 'dd MMMM yyyy HH:mm', {
                  locale: th,
                })}
              </div>
            )}
            {plan.updatedAt && (
              <div>
                แก้ไขล่าสุด:{' '}
                {format(new Date(plan.updatedAt), 'dd MMMM yyyy HH:mm', {
                  locale: th,
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/pre-call-plans')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
            >
              กลับ
            </button>

            {plan.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => router.push(`/pre-call-plans/${plan.id}/edit`)}
                  className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  แก้ไข
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  ส่งอนุมัติ
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium ml-auto"
                >
                  ลบ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
