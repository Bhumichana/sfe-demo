'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi } from '@/services/api';
import { PreCallPlan } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<PreCallPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PreCallPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user is a manager (Sales Manager, Supervisor, Product Manager, Marketing Manager)
    if (user?.role !== 'SM' && user?.role !== 'SUP' && user?.role !== 'PM' && user?.role !== 'MM') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      router.push('/');
      return;
    }

    loadPendingApprovals();
  }, [isAuthenticated, user]);

  const loadPendingApprovals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await preCallPlansApi.findPendingApprovals(user.id);
      setPlans(data);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (plan: PreCallPlan) => {
    setSelectedPlan(plan);
    setAction('approve');
    setReason('');
    setShowModal(true);
  };

  const handleReject = (plan: PreCallPlan) => {
    setSelectedPlan(plan);
    setAction('reject');
    setReason('');
    setShowModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!user || !selectedPlan) return;

    if (action === 'reject' && !reason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    try {
      setSubmitting(true);
      await preCallPlansApi.approveOrReject(selectedPlan.id, {
        action,
        approverId: user.id,
        reason: reason.trim() || undefined,
      });
      alert(action === 'approve' ? 'อนุมัติสำเร็จ' : 'ปฏิเสธสำเร็จ');
      setShowModal(false);
      setSelectedPlan(null);
      setReason('');
      loadPendingApprovals();
    } catch (error: any) {
      console.error('Failed to process approval:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout title="รออนุมัติ" subtitle="Pre-Call Plans ที่รออนุมัติจากคุณ" showBackButton={true}>
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{plans.length}</h2>
              <p className="text-white/90 text-sm">แผนรออนุมัติ</p>
            </div>
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ไม่มีแผนรออนุมัติ
            </h3>
            <p className="text-gray-500">คุณได้อนุมัติแผนทั้งหมดแล้ว</p>
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
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
                        รออนุมัติ
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
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
                        <span>
                          พนักงาน: {plan.sr?.fullName || 'ไม่ระบุ'}
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          วันที่วางแผน:{' '}
                          {format(new Date(plan.planDate), 'dd MMMM yyyy', {
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>ผู้ติดต่อ: {plan.contact?.name || 'ไม่ระบุ'}</span>
                      </div>
                    </div>

                    {plan.objectives && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                          วัตถุประสงค์:
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {plan.objectives}
                        </p>
                      </div>
                    )}

                    {plan.plannedActivities &&
                      plan.plannedActivities.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            กิจกรรมที่วางแผน:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {plan.plannedActivities.map((activity, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleApprove(plan)}
                    className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center justify-center gap-2"
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => handleReject(plan)}
                    className="flex-1 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2"
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval/Reject Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {action === 'approve' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">ลูกค้า:</p>
              <p className="font-semibold">{selectedPlan.customer?.name}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">
                พนักงาน:
              </p>
              <p className="font-semibold">{selectedPlan.sr?.fullName}</p>
            </div>

            {action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  เหตุผล <span className="text-error">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={4}
                  placeholder="ระบุเหตุผลในการปฏิเสธ..."
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPlan(null);
                  setReason('');
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={submitting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitDecision}
                className={`flex-1 px-6 py-3 rounded-lg transition-colors font-medium text-white ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={submitting}
              >
                {submitting
                  ? 'กำลังดำเนินการ...'
                  : action === 'approve'
                  ? 'ยืนยันการอนุมัติ'
                  : 'ยืนยันการปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
