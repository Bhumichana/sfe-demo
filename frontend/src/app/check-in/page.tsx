'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi, callReportsApi } from '@/services/api';
import { PreCallPlan } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';
import { format, startOfToday, endOfToday } from 'date-fns';

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function CheckInPage() {
  const router = useRouter();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [plans, setPlans] = useState<PreCallPlan[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user) {
      loadTodayPlans();
      getCurrentLocation();
    }
  }, [isAuthenticated, user, router]);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGettingLocation(false);
      },
      (error) => {
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        setLocationError(message);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const loadTodayPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = startOfToday();
      const endToday = endOfToday();

      const allPlans = await preCallPlansApi.findByUser(user.id, 'APPROVED');

      // Filter today's approved plans
      const todayPlans = allPlans.filter((plan) => {
        const planDate = new Date(plan.planDate);
        return planDate >= today && planDate <= endToday;
      });

      setPlans(todayPlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
      alert('ไม่สามารถโหลดแผนการเยี่ยมได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (plan: PreCallPlan) => {
    if (!user || !currentLocation) return;

    if (!confirm(`ยืนยันการ Check-in ที่ ${plan.customer?.name || 'ลูกค้า'}?`)) {
      return;
    }

    try {
      setCheckingIn(true);

      const callReport = await callReportsApi.create({
        preCallPlanId: plan.id,
        srId: user.id,
        customerId: plan.customerId,
        contactId: plan.contactId,
        callDate: new Date().toISOString(),
        checkInTime: new Date().toISOString(),
        checkInLat: currentLocation.lat,
        checkInLng: currentLocation.lng,
        callActivityType: 'FACE_TO_FACE',
        activitiesDone: plan.plannedActivities || [],
        isPlanned: true,
      });

      alert('Check-in สำเร็จ!\n\nกรุณากรอกรายงานการเยี่ยม');
      router.push(`/call-reports/${callReport.id}/edit`);
    } catch (error: any) {
      console.error('Check-in failed:', error);
      alert(error.response?.data?.message || 'ไม่สามารถ Check-in ได้');
    } finally {
      setCheckingIn(false);
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
    <MainLayout title="Check-in Now" subtitle="เช็คอินเพื่อเริ่มการเยี่ยมลูกค้า" showBackButton={true}>
      <div className="space-y-6">
        {/* Current Location Card */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Your Current Location
          </h3>

          {gettingLocation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
              <span>Getting your location...</span>
            </div>
          )}

          {locationError && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
              <p className="text-error text-sm">{locationError}</p>
              <button
                onClick={getCurrentLocation}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Try Again
              </button>
            </div>
          )}

          {currentLocation && !gettingLocation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Latitude:</span>
                <span className="text-sm font-mono">{currentLocation.lat.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Longitude:</span>
                <span className="text-sm font-mono">{currentLocation.lng.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Accuracy:</span>
                <span className={`text-sm font-medium ${
                  currentLocation.accuracy <= 20 ? 'text-success' :
                  currentLocation.accuracy <= 50 ? 'text-warning' :
                  'text-error'
                }`}>
                  ±{Math.round(currentLocation.accuracy)}m
                </span>
              </div>
              {currentLocation.accuracy > 20 && (
                <div className="mt-2 text-sm text-warning">
                  ⚠️ GPS signal is weak. Please move to an open area for better accuracy.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's Pre-Call Plans */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Today's Pre-Call Plans
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-muted-foreground font-semibold mb-2">ไม่มีแผนที่พร้อม Check-in</p>
              <p className="text-sm text-muted-foreground mb-4">
                คุณอาจเช็คอินแล้วทั้งหมด หรือยังไม่มีแผนที่อนุมัติสำหรับวันนี้
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => router.push('/calendar')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  📅 ดูปฏิทินแผน
                </button>
                <button
                  onClick={() => router.push('/pre-call-plans/create')}
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
                >
                  + สร้างแผนใหม่
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-4 border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{plan.customer?.name || 'ลูกค้า'}</h4>
                      <p className="text-sm text-muted-foreground">{plan.customer?.code || '-'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{plan.customer?.address || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Contact:</span>
                      <span>{plan.contact?.name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Objectives:</span>
                      <span>{plan.objectives || '-'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckIn(plan)}
                    disabled={!currentLocation || checkingIn}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      currentLocation && !checkingIn
                        ? 'bg-success text-white hover:bg-success/90 shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {checkingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>กำลังเช็คอิน...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>ยืนยันเช็คอิน</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
