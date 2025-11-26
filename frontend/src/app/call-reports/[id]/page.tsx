'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { callReportsApi } from '@/services/api';
import { CallReport } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
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

const STATUS_COLORS = {
  DRAFT: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  SUBMITTED: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_LABELS = {
  DRAFT: 'ฉบับร่าง',
  SUBMITTED: 'ส่งแล้ว',
};

export default function CallReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [report, setReport] = useState<CallReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<any[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (params.id) {
      loadReport();
    }
  }, [isAuthenticated, params.id]);

  // Auto-refresh data when user returns to this page
  useEffect(() => {
    const handleFocus = () => {
      if (params.id && !loading) {
        loadReport();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [params.id, loading]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await callReportsApi.findOne(params.id as string);
      setReport(data);

      // Load photos
      await loadPhotos();
    } catch (error) {
      console.error('Failed to load report:', error);
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

  const handleCheckOut = async () => {
    if (!user || !report) return;

    if (!confirm('ยืนยันการ Check-out?')) return;

    try {
      setGettingLocation(true);

      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setGettingLocation(false);
      setCheckingOut(true);

      await callReportsApi.checkOut(
        report.id,
        user.id,
        {
          checkOutTime: new Date().toISOString(),
          checkOutLat: position.coords.latitude,
          checkOutLng: position.coords.longitude,
        }
      );

      alert('Check-out สำเร็จ!');
      await loadReport(); // Reload report to show updated data
    } catch (error: any) {
      console.error('Check-out failed:', error);
      if (error.code) {
        // Geolocation error
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้\nกรุณาเปิดใช้งาน Location และลองอีกครั้ง');
      } else {
        alert(error.response?.data?.message || 'ไม่สามารถ Check-out ได้');
      }
    } finally {
      setCheckingOut(false);
      setGettingLocation(false);
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
      <MainLayout title="รายละเอียดรายงาน" subtitle="Call Report Detail" showBackButton={true}>
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
          <p className="text-gray-500 mb-6">ไม่พบรายงานที่คุณต้องการ</p>
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

  // Check if user can check-out
  const canCheckOut = report && report.checkInTime && !report.checkOutTime && report.status === 'DRAFT';

  return (
    <MainLayout title="รายละเอียดรายงาน" subtitle="Call Report Detail" showBackButton={true}>
      <div className="space-y-6">
        {/* Check-out Button - Show at top if available */}
        {canCheckOut && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-lg font-bold mb-1">🚪 Ready to Check-out?</h3>
                <p className="text-white/90 text-sm">
                  Checked in at {format(new Date(report.checkInTime), 'HH:mm น.', { locale: th })}
                </p>
              </div>
              <button
                onClick={handleCheckOut}
                disabled={checkingOut || gettingLocation}
                className="px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gettingLocation ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                    Getting GPS...
                  </span>
                ) : checkingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                    Checking out...
                  </span>
                ) : (
                  '🚪 Check-out Now'
                )}
              </button>
            </div>
          </div>
        )}

        {/* GPS Location Map */}
        {report && (report.checkInLat && report.checkInLng) && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              GPS Location Map
              {report.checkOutLat && report.checkOutLng && (
                <span className="text-sm text-green-600 font-medium ml-2">
                  (Check-in & Check-out)
                </span>
              )}
            </h3>
            <DynamicLocationMap
              currentLocation={{
                lat: report.checkInLat,
                lng: report.checkInLng,
              }}
              customerLocation={
                report.customer?.lat && report.customer?.lng
                  ? {
                      lat: report.customer.lat,
                      lng: report.customer.lng,
                      name: report.customer.name,
                      address: report.customer.address,
                    }
                  : undefined
              }
              height="450px"
              showDistanceCircle={false}
            />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">📍 Check-in Location:</span>
                  <br />
                  {Number(report.checkInLat).toFixed(6)}, {Number(report.checkInLng).toFixed(6)}
                  <br />
                  <span className="text-xs">
                    {report.checkInTime && format(new Date(report.checkInTime), 'dd/MM/yyyy HH:mm น.', { locale: th })}
                  </span>
                </p>
              </div>
              {report.checkOutLat && report.checkOutLng && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">🚪 Check-out Location:</span>
                    <br />
                    {Number(report.checkOutLat).toFixed(6)}, {Number(report.checkOutLng).toFixed(6)}
                    <br />
                    <span className="text-xs">
                      {report.checkOutTime && format(new Date(report.checkOutTime), 'dd/MM/yyyy HH:mm น.', { locale: th })}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {report.customer?.name || 'ไม่ระบุลูกค้า'}
                </h1>
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
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
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
                <div>
                  <span className="text-sm text-muted-foreground">วันที่เยี่ยม:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(report.callDate), 'dd MMMM yyyy HH:mm น.', {
                      locale: th,
                    })}
                  </span>
                </div>
              </div>

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
                <div>
                  <span className="text-sm text-muted-foreground">ผู้ติดต่อ:</span>
                  <span className="ml-2 font-medium">
                    {report.contact?.name || 'ไม่ระบุ'}
                  </span>
                </div>
              </div>

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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <span className="text-sm text-muted-foreground">ประเภท:</span>
                  <span className="ml-2 font-medium">
                    {report.activityType === 'VIRTUAL' ? 'Virtual' : 'พบหน้า'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {report.checkInTime && (
                <div className="flex items-center gap-2 text-foreground">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <div>
                    <span className="text-sm text-muted-foreground">Check-in:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(report.checkInTime), 'HH:mm น.', { locale: th })}
                    </span>
                  </div>
                </div>
              )}

              {report.checkOutTime && (
                <div className="flex items-center gap-2 text-foreground">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <div>
                    <span className="text-sm text-muted-foreground">Check-out:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(report.checkOutTime), 'HH:mm น.', { locale: th })}
                    </span>
                  </div>
                </div>
              )}

              {report.durationMinutes !== undefined && (
                <div className="flex items-center gap-2 text-foreground">
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                  <div>
                    <span className="text-sm text-muted-foreground">ระยะเวลา:</span>
                    <span className="ml-2 font-medium">{report.durationMinutes} นาที</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activities Done */}
        {report.activitiesDone && report.activitiesDone.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              กิจกรรมที่ทำ
            </h2>
            <div className="flex flex-wrap gap-2">
              {report.activitiesDone.map((activity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Customer Feedback Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.customerResponse && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-md font-bold text-foreground mb-2">ความคิดเห็นลูกค้า</h3>
              <p className="text-muted-foreground">{report.customerResponse}</p>
            </div>
          )}

          {report.customerRequest && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-md font-bold text-foreground mb-2">ความต้องการของลูกค้า</h3>
              <p className="text-muted-foreground">{report.customerRequest}</p>
            </div>
          )}

          {report.customerObjections && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-md font-bold text-foreground mb-2">ข้อโต้แย้งของลูกค้า</h3>
              <p className="text-muted-foreground">{report.customerObjections}</p>
            </div>
          )}

          {report.customerNeeds && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-md font-bold text-foreground mb-2">ความต้องการเพิ่มเติม</h3>
              <p className="text-muted-foreground">{report.customerNeeds}</p>
            </div>
          )}

          {report.customerComplaints && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-md font-bold text-foreground mb-2">ข้อร้องเรียน</h3>
              <p className="text-muted-foreground">{report.customerComplaints}</p>
            </div>
          )}

          {report.nextAction && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-md font-bold text-foreground mb-2">การติดตามครั้งถัดไป</h3>
              <p className="text-muted-foreground">{report.nextAction}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">ข้อมูลเพิ่มเติม</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">สร้างเมื่อ:</span>
              <span className="ml-2 text-foreground">
                {format(new Date(report.createdAt), 'dd MMM yyyy HH:mm น.', {
                  locale: th,
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">แก้ไขล่าสุด:</span>
              <span className="ml-2 text-foreground">
                {format(new Date(report.updatedAt), 'dd MMM yyyy HH:mm น.', {
                  locale: th,
                })}
              </span>
            </div>
            {report.sr && (
              <div>
                <span className="text-muted-foreground">ผู้สร้าง:</span>
                <span className="ml-2 text-foreground">{report.sr.fullName}</span>
              </div>
            )}
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
                  <div className="mt-2 text-xs">
                    <div className="font-medium text-foreground text-center mb-1">
                      {(photo.category?.toUpperCase() === 'PRODUCT' || photo.category?.toLowerCase() === 'product') && '📦 สินค้า'}
                      {(photo.category?.toUpperCase() === 'POP_POSM' || photo.category?.toLowerCase() === 'pop_posm') && '🎨 POP/POSM'}
                      {(photo.category?.toUpperCase() === 'CUSTOMER' || photo.category?.toLowerCase() === 'customer') && '🏢 ลูกค้า'}
                      {(photo.category?.toUpperCase() === 'ACTIVITY' || photo.category?.toLowerCase() === 'activity') && '🎯 กิจกรรม'}
                      {(photo.category?.toUpperCase() === 'OTHER' || photo.category?.toLowerCase() === 'other') && '📷 อื่นๆ'}
                      {!photo.category && '📷 ไม่ระบุ'}
                    </div>
                    {photo.timestamp && (
                      <div className="text-muted-foreground text-center">
                        {format(new Date(photo.timestamp), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                    {photo.lat && photo.lng && (
                      <div className="text-muted-foreground text-center text-[10px] mt-1">
                        📍 {parseFloat(photo.lat).toFixed(4)}, {parseFloat(photo.lng).toFixed(4)}
                      </div>
                    )}
                  </div>
                  {report.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="ลบรูป"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/call-reports')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
          >
            กลับ
          </button>
          {report.status === 'DRAFT' && (
            <button
              onClick={() => router.push(`/call-reports/${report.id}/edit`)}
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              แก้ไข / อัพเดท Call Plan
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
