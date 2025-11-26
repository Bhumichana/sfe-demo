'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { callReportsApi, customersApi, activityTypesApi } from '@/services/api';
import { Customer, Contact, ActivityTypeData, ActivityType, CallReport } from '@/types';
import { format } from 'date-fns';
import MainLayout from '@/components/layouts/MainLayout';
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

export default function EditCallReportPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();

  const [report, setReport] = useState<CallReport | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [formData, setFormData] = useState({
    callActivityType: 'FACE_TO_FACE' as ActivityType,
    activitiesDone: [] as string[],
    customerResponse: '',
    customerRequest: '',
    customerObjections: '',
    customerNeeds: '',
    customerComplaints: '',
    nextAction: '',
    durationMinutes: undefined as number | undefined,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (params.id) {
      loadData();
    }
  }, [isAuthenticated, params.id]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [reportData, customersData, activityTypesData] = await Promise.all([
        callReportsApi.findOne(params.id as string),
        customersApi.findAll(),
        activityTypesApi.findAll(),
      ]);

      // Check if user owns this report
      if (reportData.srId !== user.id) {
        alert('คุณไม่มีสิทธิ์แก้ไขรายงานนี้');
        router.push('/call-reports');
        return;
      }

      // Check if report is DRAFT
      if (reportData.status !== 'DRAFT') {
        alert('สามารถแก้ไขได้เฉพาะรายงานที่อยู่ในสถานะฉบับร่างเท่านั้น');
        router.push(`/call-reports/${reportData.id}`);
        return;
      }

      setReport(reportData);
      setCustomers(customersData);
      setActivityTypes(activityTypesData.filter(at => at.isActive));

      // Load contacts for the customer
      if (reportData.customerId) {
        const contactsData = await customersApi.getContacts(reportData.customerId);
        setContacts(contactsData);
      }

      // Load photos
      await loadPhotos();

      // Pre-fill form with existing data
      setFormData({
        callActivityType: reportData.activityType || 'FACE_TO_FACE',
        activitiesDone: reportData.activitiesDone || [],
        customerResponse: reportData.customerResponse || '',
        customerRequest: reportData.customerRequest || '',
        customerObjections: reportData.customerObjections || '',
        customerNeeds: reportData.customerNeeds || '',
        customerComplaints: reportData.customerComplaints || '',
        nextAction: reportData.nextAction || '',
        durationMinutes: reportData.durationMinutes,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      router.push('/call-reports');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const photosData = await callReportsApi.getPhotos(params.id as string);
      setPhotos(photosData);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

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

  const handleCheckIn = async () => {
    if (!user || !report || !currentLocation) return;

    const customer = report.customer;

    if (!confirm(`ยืนยันการ Check-in ที่ ${customer?.name || 'ลูกค้า'}?`)) {
      return;
    }

    try {
      setCheckingIn(true);

      // Update call report with check-in data
      await callReportsApi.update(report.id, user.id, {
        checkInTime: new Date().toISOString(),
        checkInLat: currentLocation.lat,
        checkInLng: currentLocation.lng,
      });

      alert('Check-in สำเร็จ!\n\nกรุณากรอกรายงานการเยี่ยมและบันทึก');

      // Reload report
      await loadData();
    } catch (error: any) {
      console.error('Check-in failed:', error);
      alert(error.response?.data?.message || 'ไม่สามารถ Check-in ได้');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (useMockGPS = false) => {
    if (!user || !report) return;

    if (!confirm('ยืนยันการ Check-out?')) {
      return;
    }

    try {
      setCheckingOut(true);

      let lat: number;
      let lng: number;

      if (useMockGPS && report.checkInLat && report.checkInLng) {
        // Dev Mode: Use check-in location for check-out
        lat = Number(report.checkInLat);
        lng = Number(report.checkInLng);
        console.log('🧪 Dev Mode: Using check-in location for check-out');
      } else {
        // Real GPS
        setGettingLocation(true);

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        setGettingLocation(false);
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      // Check-out with GPS data (backend will calculate duration)
      await callReportsApi.checkOut(report.id, user.id, {
        checkOutTime: new Date().toISOString(),
        checkOutLat: lat,
        checkOutLng: lng,
      });

      alert(useMockGPS
        ? '🧪 Dev Mode: Check-out สำเร็จ!\n\nระบบจะพาคุณไปหน้ารายละเอียด'
        : 'Check-out สำเร็จ!\n\nระบบจะพาคุณไปหน้ารายละเอียด'
      );

      // Redirect to detail page
      router.push(`/call-reports/${report.id}`);
    } catch (error: any) {
      setGettingLocation(false);
      if (error.code) {
        // Geolocation error
        let message = 'ไม่สามารถดึงตำแหน่ง GPS ได้';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง GPS';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่';
            break;
          case error.TIMEOUT:
            message = 'หมดเวลาในการรอ GPS กรุณาลองใหม่';
            break;
        }
        alert(message);
      } else {
        console.error('Check-out failed:', error);
        alert(error.response?.data?.message || 'ไม่สามารถ Check-out ได้');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('คุณต้องการลบรูปนี้หรือไม่?')) return;

    try {
      await callReportsApi.deletePhoto(params.id as string, photoId);
      alert('ลบรูปสำเร็จ');
      await loadPhotos(); // Reload photos
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('ไม่สามารถลบรูปได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleActivityToggle = (activityName: string) => {
    setFormData(prev => ({
      ...prev,
      activitiesDone: prev.activitiesDone.includes(activityName)
        ? prev.activitiesDone.filter(a => a !== activityName)
        : [...prev.activitiesDone, activityName],
    }));
  };

  const validateForm = (): boolean => {
    if (formData.activitiesDone.length === 0) {
      alert('กรุณาเลือกกิจกรรมอย่างน้อย 1 รายการ');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!user || !report) return;

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      await callReportsApi.update(report.id, user.id, {
        activityType: formData.callActivityType,
        activitiesDone: formData.activitiesDone,
        customerResponse: formData.customerResponse || undefined,
        customerRequest: formData.customerRequest || undefined,
        customerObjections: formData.customerObjections || undefined,
        customerNeeds: formData.customerNeeds || undefined,
        customerComplaints: formData.customerComplaints || undefined,
        nextAction: formData.nextAction || undefined,
        durationMinutes: formData.durationMinutes,
      });

      alert('แก้ไขรายงานสำเร็จ');
      router.push(`/call-reports/${report.id}`);
    } catch (error: any) {
      console.error('Failed to update:', error);
      alert(error.response?.data?.message || 'ไม่สามารถแก้ไขรายงานได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  // Get icon for activity type
  const getActivityIcon = (activityName: string): string => {
    const name = activityName.toLowerCase();

    if (name.includes('detail') && name.includes('product')) return '📦';
    if (name.includes('pop') || name.includes('posm') || name.includes('วาง')) return '🎯';
    if (name.includes('propose') || name.includes('list') || name.includes('เสนอ') || name.includes('listing')) return '📋';
    if (name.includes('present')) return '🎤';
    if (name.includes('sampling') || name.includes('แจก')) return '🎁';
    if (name.includes('problem') || name.includes('แก้ไข') || name.includes('ปัญหา')) return '🔧';
    if (name.includes('order') || name.includes('รับ') || name.includes('ออเดอร์')) return '📝';
    if (name.includes('stock') || name.includes('เช็ค') || name.includes('สต๊อก')) return '📊';
    if (name.includes('train') || name.includes('อบรม')) return '🎓';
    if (name.includes('promotion') || name.includes('โปรโมชั่น')) return '🎉';
    if (name.includes('payment') || name.includes('collection') || name.includes('billing') || name.includes('เก็บเงิน') || name.includes('วางบิล') || name.includes('ตามบิล')) return '💰';
    if (name.includes('delivery') || name.includes('ส่งของ')) return '🚚';
    if (name.includes('meeting') || name.includes('ประชุม') || name.includes('business') || name.includes('meal')) return '🍽️';
    if (name.includes('survey') || name.includes('สำรวจ')) return '🔍';
    if (name.includes('follow') || name.includes('spec') || name.includes('ติดตาม')) return '📞';
    if (name.includes('booth') || name.includes('event') || name.includes('ออก') || name.includes('บูธ')) return '🏪';
    if (name.includes('budget') || name.includes('engage') || name.includes('ประมาณ')) return '💼';

    return '📌';
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
      <MainLayout title="แก้ไขรายงาน" subtitle="Edit Call Report" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!report) {
    return (
      <MainLayout title="ไม่พบข้อมูล" subtitle="Not Found" showBackButton={true}>
        <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">ไม่พบรายงาน</h3>
          <p className="text-gray-500 mb-6">ไม่พบรายงานที่คุณต้องการแก้ไข</p>
          <button
            onClick={() => router.push('/call-reports')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="แก้ไขรายงาน" subtitle="Edit Call Report" showBackButton={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="text-lg font-bold text-foreground">แก้ไขรายงาน</h2>
          </div>
          <div className="text-sm text-gray-700">
            <div><strong>ลูกค้า:</strong> {report.customer?.name}</div>
            <div><strong>ผู้ติดต่อ:</strong> {report.contact?.name}</div>
            <div><strong>วันที่เยี่ยม:</strong> {format(new Date(report.callDate), 'dd/MM/yyyy HH:mm')}</div>
          </div>
        </div>

        {/* Call Details */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">รายละเอียดการเยี่ยม</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              ประเภทการเยี่ยม <span className="text-error">*</span>
            </label>
            <select
              value={formData.callActivityType}
              onChange={(e) => setFormData(prev => ({ ...prev, callActivityType: e.target.value as ActivityType }))}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="FACE_TO_FACE">พบหน้า (Face-to-Face)</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
          </div>
        </div>

        {/* Activities Done */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            กิจกรรมที่ทำ <span className="text-error">*</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activityTypes
              .filter((activity, index, self) =>
                index === self.findIndex((a) => a.nameTh === activity.nameTh)
              )
              .map((activity) => {
                const isSelected = formData.activitiesDone.includes(activity.nameTh);
                const icon = getActivityIcon(activity.nameEn || activity.nameTh);

                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleActivityToggle(activity.nameTh)}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-primary bg-primary text-white shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`text-4xl mb-2 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                      {icon}
                    </div>
                    <div className={`text-center text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {activity.nameTh}
                    </div>
                    {activity.nameEn && (
                      <div className={`text-xs mt-1 text-center line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {activity.nameEn}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          {formData.activitiesDone.length === 0 && (
            <p className="text-sm text-error mt-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              กรุณาเลือกกิจกรรมอย่างน้อย 1 รายการ
            </p>
          )}
        </div>

        {/* Customer Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">ข้อมูลจากลูกค้า</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ความคิดเห็นของลูกค้า (Customer Response)
              </label>
              <textarea
                value={formData.customerResponse}
                onChange={(e) => setFormData(prev => ({ ...prev, customerResponse: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกความคิดเห็นของลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ความต้องการของลูกค้า (Customer Request)
              </label>
              <textarea
                value={formData.customerRequest}
                onChange={(e) => setFormData(prev => ({ ...prev, customerRequest: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกความต้องการของลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ข้อโต้แย้ง (Customer Objections)
              </label>
              <textarea
                value={formData.customerObjections}
                onChange={(e) => setFormData(prev => ({ ...prev, customerObjections: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกข้อโต้แย้งของลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ความต้องการเพิ่มเติม (Customer Needs)
              </label>
              <textarea
                value={formData.customerNeeds}
                onChange={(e) => setFormData(prev => ({ ...prev, customerNeeds: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกความต้องการเพิ่มเติม..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ข้อร้องเรียน (Customer Complaints)
              </label>
              <textarea
                value={formData.customerComplaints}
                onChange={(e) => setFormData(prev => ({ ...prev, customerComplaints: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกข้อร้องเรียน..."
              />
            </div>
          </div>
        </div>

        {/* Next Action */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">การติดตามครั้งถัดไป</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Next Action
            </label>
            <textarea
              value={formData.nextAction}
              onChange={(e) => setFormData(prev => ({ ...prev, nextAction: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="บันทึกสิ่งที่จะทำในการเยี่ยมครั้งถัดไป..."
            />
          </div>
        </div>

        {/* Photos Gallery */}
        {photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              รูปภาพที่แนบ ({photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo: any) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-border">
                    <img
                      src={photo.url}
                      alt={photo.category}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="mt-2 text-xs text-center">
                    <div className="font-medium text-foreground">
                      {photo.category === 'PRODUCT' && '📦 สินค้า'}
                      {photo.category === 'POP_POSM' && '🎨 POP/POSM'}
                      {photo.category === 'CUSTOMER' && '🏢 ลูกค้า'}
                      {photo.category === 'ACTIVITY' && '🎯 กิจกรรม'}
                      {photo.category === 'OTHER' && '📷 อื่นๆ'}
                    </div>
                    {photo.timestamp && (
                      <div className="text-muted-foreground">
                        {format(new Date(photo.timestamp), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="ลบรูป"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Check-in Section - Show if not checked in yet */}
        {report.status === 'DRAFT' && !report.checkInTime && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Check-in Required
            </h2>

            {!currentLocation && !gettingLocation && (
              <button
                onClick={getCurrentLocation}
                className="w-full mb-4 px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-gray-100 transition-colors font-bold shadow-lg"
              >
                📍 Get My Location
              </button>
            )}

            {gettingLocation && (
              <div className="mb-4 flex items-center justify-center gap-2 text-white bg-white/20 rounded-lg p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Getting your location...</span>
              </div>
            )}

            {locationError && (
              <div className="mb-4 bg-red-500 text-white rounded-lg p-4">
                <p className="text-sm">{locationError}</p>
                <button
                  onClick={getCurrentLocation}
                  className="mt-2 text-sm underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {currentLocation && (
              <>
                <div className="mb-3 p-3 bg-white/20 rounded-lg text-white text-sm">
                  <div className="flex items-center justify-between">
                    <span>GPS Location:</span>
                    <span className="font-bold text-green-200">
                      {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)} ✅
                    </span>
                  </div>
                  {currentLocation.accuracy > 20 && (
                    <div className="mt-2 text-xs text-yellow-200">
                      ⚠️ GPS accuracy: ±{Math.round(currentLocation.accuracy)}m - Move to open area for better signal
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className={`w-full py-3 px-6 rounded-lg font-bold shadow-lg transition-all ${
                    !checkingIn
                      ? 'bg-white text-green-700 hover:bg-gray-100'
                      : 'bg-white/30 text-white cursor-not-allowed'
                  }`}
                >
                  {checkingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Checking in...
                    </span>
                  ) : (
                    '🚀 Check-in Now'
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Quick Photo Action - Only for DRAFT reports */}
        {report.status === 'DRAFT' && (
          <div className="bg-gradient-to-r from-violet-500 to-blue-500 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">📸 Quick Actions</h2>
            <button
              type="button"
              onClick={() => router.push(`/quick-photo?callReportId=${report.id}&returnTo=edit`)}
              className="w-full bg-white/90 hover:bg-white backdrop-blur-sm border-2 border-white rounded-xl p-4 shadow-xl transition-all flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 text-blue-600">
                📷
              </div>
              <span className="font-bold text-sm text-blue-700">ถ่ายรูป</span>
            </button>
          </div>
        )}

        {/* GPS Location Map & Check-out Section - Show after check-in */}
        {report.status === 'DRAFT' && report.checkInTime && (
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              GPS Location Map
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white/20 rounded-lg text-white text-sm">
                <p className="font-semibold mb-1">📍 Check-in Location</p>
                <p className="text-xs opacity-90">
                  {Number(report.checkInLat).toFixed(6)}, {Number(report.checkInLng).toFixed(6)}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {report.checkInTime && format(new Date(report.checkInTime), 'dd/MM/yyyy HH:mm น.')}
                </p>
              </div>

              {report.checkOutLat && report.checkOutLng && (
                <div className="p-3 bg-white/20 rounded-lg text-white text-sm">
                  <p className="font-semibold mb-1">🚪 Check-out Location</p>
                  <p className="text-xs opacity-90">
                    {Number(report.checkOutLat).toFixed(6)}, {Number(report.checkOutLng).toFixed(6)}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {report.checkOutTime && format(new Date(report.checkOutTime), 'dd/MM/yyyy HH:mm น.')}
                  </p>
                </div>
              )}
            </div>

            {/* Check-out Button - Show if not checked out yet */}
            {!report.checkOutTime && (
              <div className="mt-4 space-y-3">
                {/* Dev Mode Button */}
                <button
                  onClick={() => handleCheckOut(true)}
                  disabled={checkingOut || gettingLocation}
                  className="w-full py-2 px-4 rounded-lg font-medium bg-purple-100 text-purple-700 border-2 border-purple-300 hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🧪 Use Store Location (Dev Mode)
                </button>

                {gettingLocation && (
                  <div className="flex items-center justify-center gap-2 text-white bg-white/20 rounded-lg p-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Getting your location...</span>
                  </div>
                )}

                <button
                  onClick={() => handleCheckOut(false)}
                  disabled={checkingOut || gettingLocation}
                  className={`w-full py-3 px-6 rounded-lg font-bold shadow-lg transition-all ${
                    !checkingOut && !gettingLocation
                      ? 'bg-white text-orange-700 hover:bg-gray-100'
                      : 'bg-white/30 text-white cursor-not-allowed'
                  }`}
                >
                  {checkingOut || gettingLocation ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      {gettingLocation ? 'Getting GPS...' : 'Checking out...'}
                    </span>
                  ) : (
                    '🚪 Check-out Now (Real GPS)'
                  )}
                </button>

                <p className="text-xs text-white/80 text-center">
                  กด Check-out เมื่อเสร็จสิ้นการเยี่ยมลูกค้า
                </p>
              </div>
            )}

            {report.checkOutTime && (
              <div className="mt-4 p-3 bg-green-500/30 border-2 border-white/30 rounded-lg text-white text-center">
                <p className="font-bold">✅ Check-out สำเร็จแล้ว</p>
                <p className="text-xs opacity-90 mt-1">
                  กรุณากรอกรายงานให้ครบถ้วนและกด "บันทึกการแก้ไข"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.push(`/call-reports/${report.id}`)}
            className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
