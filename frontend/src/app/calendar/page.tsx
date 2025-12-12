'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi, managerApi } from '@/services/api';
import { PreCallPlan, PlanStatus } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { th } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

const STATUS_COLORS: Record<PlanStatus, string> = {
  DRAFT: 'bg-yellow-500',
  PENDING: 'bg-orange-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
};

const STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่อนุมัติ',
};

export default function CalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState<PreCallPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user, currentMonth]);

  const loadPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if user is a manager
      const isManager = user.role === 'SM' || user.role === 'SUP' || user.role === 'PM' || user.role === 'MM';

      let data;
      if (isManager) {
        // Load plans for all team members
        data = await managerApi.getTeamPlans(user.id);
      } else {
        // Load plans for current user only
        data = await preCallPlansApi.findByUser(user.id);
      }

      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlansForDate = (date: Date): PreCallPlan[] => {
    return plans.filter(plan =>
      isSameDay(new Date(plan.planDate), date)
    );
  };

  const getStatusIndicators = (date: Date): PlanStatus[] => {
    const plansForDate = getPlansForDate(date);
    const statuses = [...new Set(plansForDate.map(plan => plan.status))];
    return statuses as PlanStatus[];
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = monthStart.getDay();

    // Create empty cells for days before the month starts
    const emptyCells = Array(firstDayOfWeek).fill(null);

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
          <div key={index} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const plansForDay = getPlansForDate(day);
          const statusIndicators = getStatusIndicators(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`aspect-square p-2 rounded-lg border transition-all ${
                isTodayDate
                  ? 'bg-primary text-white border-primary shadow-md'
                  : isSelected
                  ? 'bg-primary/10 border-primary'
                  : plansForDay.length > 0
                  ? 'bg-white border-gray-200 hover:border-primary hover:shadow-sm'
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="h-full flex flex-col items-center justify-between">
                <span className={`text-sm font-semibold ${
                  isTodayDate ? 'text-white' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>

                {/* Status indicators */}
                {statusIndicators.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {statusIndicators.slice(0, 3).map((status, index) => (
                      <div
                        key={`${status}-${index}`}
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]}`}
                        title={STATUS_LABELS[status]}
                      />
                    ))}
                    {statusIndicators.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="มีหลายแผน" />
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    // Group plans by date
    const groupedPlans = plans.reduce((acc, plan) => {
      const dateKey = format(new Date(plan.planDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(plan);
      return acc;
    }, {} as Record<string, PreCallPlan[]>);

    // Sort dates ascending (earliest first)
    const sortedDates = Object.keys(groupedPlans).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    return (
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ยังไม่มีแผนการเยี่ยมเยียน
            </h3>
            <p className="text-gray-500 mb-6">
              เริ่มสร้างแผนการเยี่ยมเยียนของคุณได้เลย
            </p>
            <button
              onClick={() => router.push('/pre-call-plans/create')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
            >
              + สร้างแผนใหม่
            </button>
          </div>
        ) : (
          sortedDates.map(dateKey => {
            const datePlans = groupedPlans[dateKey];
            const date = new Date(dateKey);
            const planCount = datePlans.length;

            return (
              <div key={dateKey} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Date Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-bold text-foreground">
                      {format(date, 'd MMMM yyyy', { locale: th })}
                    </h3>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {planCount} แผน
                  </span>
                </div>

                {/* Plans List */}
                <div className="divide-y divide-border">
                  {datePlans
                    .sort((a, b) => new Date(a.planDate).getTime() - new Date(b.planDate).getTime())
                    .map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => router.push(`/pre-call-plans/${plan.id}`)}
                        className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-start gap-4">
                          {/* Time */}
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className="text-lg font-bold text-primary">
                              {format(new Date(plan.planDate), 'HH:mm')}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            {/* SR Name (for managers) */}
                            {plan.sr && (user?.role === 'SM' || user?.role === 'SUP' || user?.role === 'PM' || user?.role === 'MM') && (
                              <div className="flex items-center gap-2 text-xs text-primary mb-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">SR: {plan.sr.fullName}</span>
                              </div>
                            )}

                            {/* Customer Name + Status */}
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <h4 className="font-semibold text-foreground truncate flex-1">
                                {plan.customer?.name || 'ไม่ระบุลูกค้า'}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                                plan.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                plan.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                plan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {STATUS_LABELS[plan.status]}
                              </span>
                            </div>

                            {/* Contact */}
                            {plan.contact && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{plan.contact.name}</span>
                              </div>
                            )}

                            {/* Activities */}
                            {plan.plannedActivities && plan.plannedActivities.length > 0 && (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="line-clamp-1">{plan.plannedActivities.join(', ')}</span>
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate) {
      return (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">เลือกวันที่เพื่อดูรายละเอียด</p>
        </div>
      );
    }

    const plansForDate = getPlansForDate(selectedDate);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">
          {format(selectedDate, 'd MMMM yyyy', { locale: th })}
        </h3>

        {plansForDate.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">ไม่มีแผนการเยี่ยมในวันนี้</p>
            <button
              onClick={() => router.push('/pre-call-plans/create')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
            >
              + สร้างแผนใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plansForDate.map((plan) => (
              <button
                key={plan.id}
                onClick={() => router.push(`/pre-call-plans/${plan.id}`)}
                className="w-full bg-white rounded-xl border border-border p-4 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[plan.status]} mt-1 flex-shrink-0`} />

                  {/* Plan details */}
                  <div className="flex-1 min-w-0">
                    {/* SR Name (for managers) */}
                    {plan.sr && (user?.role === 'SM' || user?.role === 'SUP' || user?.role === 'PM' || user?.role === 'MM') && (
                      <div className="text-xs text-primary font-medium mb-1">
                        SR: {plan.sr.fullName}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">
                        {plan.customer?.name || 'ไม่ระบุลูกค้า'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        plan.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                        plan.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                        plan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {STATUS_LABELS[plan.status]}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{format(new Date(plan.planDate), 'HH:mm น.')}</span>
                      </div>
                      {plan.contact && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{plan.contact.name}</span>
                        </div>
                      )}
                      {plan.plannedActivities && plan.plannedActivities.length > 0 && (
                        <div className="flex items-start gap-2 mt-2">
                          <svg className="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="line-clamp-1">{plan.plannedActivities.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout title="ปฏิทิน" subtitle="Calendar" showBackButton={true}>
      <div className="space-y-6">
        {/* View Toggle Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ปฏิทิน
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              รายการ
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <>
            {/* Month Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="gradient-gold flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: th })}
            </h2>

            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="p-4">
            {/* Calendar Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">สถานะแผน</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status as PlanStatus]}`} />
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Date Details */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              {renderSelectedDateDetails()}
            </div>
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderListView()
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
