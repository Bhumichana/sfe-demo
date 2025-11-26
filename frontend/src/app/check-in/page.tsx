'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi, callReportsApi } from '@/services/api';
import MainLayout from '@/components/layouts/MainLayout';
import LocationMap from '@/components/maps/LocationMap';
import { format, startOfToday, endOfToday } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamically import LocationMap to avoid SSR issues with Leaflet
const DynamicLocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
}

interface PreCallPlan {
  id: string;
  customer: {
    id: string;
    code: string;
    name: string;
    lat: number | null;
    lng: number | null;
    address: string;
  };
  contact: {
    name: string;
    position: string;
  };
  planDate: string;
  objectives: string;
  plannedActivities: string[];
}

const MAX_DISTANCE = 100; // meters (for testing)

// Haversine formula to calculate distance between two GPS coordinates
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function CheckInPage() {
  const router = useRouter();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [plans, setPlans] = useState<PreCallPlan[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PreCallPlan | null>(null);

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
        enableHighAccuracy: true, // Use GPS for high accuracy
        timeout: 10000,
        maximumAge: 0, // Don't use cached location
      }
    );
  };

  // DEV MODE: Mock location using store's coordinates
  const useMockLocation = (plan: PreCallPlan) => {
    if (plan.customer.lat && plan.customer.lng) {
      setCurrentLocation({
        lat: Number(plan.customer.lat),
        lng: Number(plan.customer.lng),
        accuracy: 5, // Mock high accuracy
      });
      setLocationError('');
      alert('🧪 Dev Mode: Using store location as your location');
    }
  };

  const loadTodayPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = startOfToday();
      const endToday = endOfToday();

      // Get all approved plans for today
      const allPlans = await preCallPlansApi.findByUser(user.id, 'APPROVED');

      // Filter plans for today
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

    // Validate customer has GPS coordinates
    if (!plan.customer.lat || !plan.customer.lng) {
      alert('ลูกค้านี้ไม่มีข้อมูล GPS กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    // Calculate distance
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      plan.customer.lat,
      plan.customer.lng
    );

    // Validate distance
    if (distance > MAX_DISTANCE) {
      alert(
        `คุณอยู่ห่างจากลูกค้า ${Math.round(distance)} เมตร\n` +
        `(ระยะห่างสูงสุดที่อนุญาต: ${MAX_DISTANCE} เมตร)\n\n` +
        `กรุณาเข้าใกล้ลูกค้ามากขึ้น`
      );
      return;
    }

    if (!confirm(`ยืนยันการ Check-in ที่ ${plan.customer.name}?`)) {
      return;
    }

    try {
      setCheckingIn(true);

      // Create call report with check-in data
      const callReport = await callReportsApi.create({
        preCallPlanId: plan.id,
        srId: user.id,
        customerId: plan.customer.id,
        contactId: plan.contact ? (plan.contact as any).id : '',
        callDate: new Date().toISOString(),
        checkInTime: new Date().toISOString(),
        checkInLat: currentLocation.lat,
        checkInLng: currentLocation.lng,
        callActivityType: 'FACE_TO_FACE',
        activitiesDone: plan.plannedActivities || [],
        customerResponse: '',
        customerRequest: '',
        customerObjections: '',
        customerNeeds: '',
        customerComplaints: '',
        nextAction: '',
      });

      alert('Check-in สำเร็จ!\n\nกรุณากรอกรายงานการเยี่ยม');
      router.push(`/call-reports/${callReport.id}`);
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
        {/* Map View */}
        {currentLocation && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              GPS Location Map
            </h3>
            <DynamicLocationMap
              currentLocation={currentLocation}
              customerLocation={
                selectedPlan?.customer?.lat && selectedPlan?.customer?.lng
                  ? {
                      lat: selectedPlan.customer.lat,
                      lng: selectedPlan.customer.lng,
                      name: selectedPlan.customer.name,
                      address: selectedPlan.customer.address,
                    }
                  : undefined
              }
              distance={
                selectedPlan?.customer?.lat && selectedPlan?.customer?.lng
                  ? calculateDistance(
                      currentLocation.lat,
                      currentLocation.lng,
                      selectedPlan.customer.lat,
                      selectedPlan.customer.lng
                    )
                  : undefined
              }
              maxDistance={MAX_DISTANCE}
              height="450px"
              showDistanceCircle={true}
            />
            {selectedPlan && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Selected Customer:</span> {selectedPlan.customer.name}
                </p>
              </div>
            )}
          </div>
        )}

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
              <p className="text-muted-foreground">No approved plans for today</p>
              <button
                onClick={() => router.push('/pre-call-plans/create')}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Create a new plan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                const customerHasGPS = plan.customer.lat && plan.customer.lng;
                const distance = currentLocation && customerHasGPS
                  ? calculateDistance(
                      currentLocation.lat,
                      currentLocation.lng,
                      plan.customer.lat!,
                      plan.customer.lng!
                    )
                  : null;

                const canCheckIn = currentLocation && distance !== null && distance <= MAX_DISTANCE;

                return (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 ${
                      canCheckIn ? 'border-success bg-success/5' :
                      selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' :
                      'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{plan.customer.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.customer.code}</p>
                        <p className="text-sm text-muted-foreground mt-1">{plan.customer.address}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{plan.contact?.name || '-'}</span>
                      </div>
                      {distance !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className={`font-medium ${
                            distance <= MAX_DISTANCE ? 'text-success' : 'text-error'
                          }`}>
                            {Math.round(distance)}m
                            {distance <= MAX_DISTANCE ? ' ✅' : ' ❌'}
                          </span>
                        </div>
                      )}
                      {!customerHasGPS && (
                        <div className="text-sm text-warning">
                          ⚠️ No GPS coordinates for this customer
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* DEV MODE Button */}
                      {customerHasGPS && (
                        <button
                          onClick={() => useMockLocation(plan)}
                          className="w-full py-2 px-4 rounded-lg font-medium bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-colors"
                        >
                          🧪 Use Store Location (Dev Mode)
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {customerHasGPS && (
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              // Scroll to map
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                              selectedPlan?.id === plan.id
                                ? 'bg-primary text-white'
                                : 'bg-blue-50 text-primary border border-primary hover:bg-blue-100'
                            }`}
                          >
                            {selectedPlan?.id === plan.id ? '📍 On Map' : '🗺️ View Map'}
                          </button>
                        )}
                        <button
                          onClick={() => handleCheckIn(plan)}
                          disabled={!canCheckIn || checkingIn}
                          className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                            canCheckIn && !checkingIn
                              ? 'bg-success text-white hover:bg-success/90'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          } ${!customerHasGPS ? 'col-span-2' : ''}`}
                        >
                          {checkingIn ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                              Checking in...
                            </span>
                          ) : (
                            '🚀 Check-in'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
