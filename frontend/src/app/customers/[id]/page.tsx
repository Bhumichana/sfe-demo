'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { customersApi } from '@/services/api';
import { Customer, CustomerStatistics, CustomerType } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';
import dynamic from 'next/dynamic';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { calculateDistance, formatDistance, openInGoogleMaps } from '@/utils/geoUtils';

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">กำลังโหลดแผนที่...</p>
    </div>
  ),
});

const TYPE_COLORS: Record<CustomerType, string> = {
  A: 'bg-purple-100 text-purple-700 border-purple-300',
  B: 'bg-blue-100 text-blue-700 border-blue-300',
  C: 'bg-gray-100 text-gray-700 border-gray-300',
};

const TYPE_LABELS: Record<CustomerType, string> = {
  A: 'VIP (>500K/month)',
  B: 'Important (100-500K/month)',
  C: 'Standard (<100K/month)',
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [statistics, setStatistics] = useState<CustomerStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  // GPS current location hook
  const { location: currentLocation, loading: locationLoading, getCurrentLocation } = useCurrentLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadCustomer();
    loadStatistics();
  }, [isAuthenticated, customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await customersApi.findOne(customerId);
      setCustomer(data);
    } catch (error) {
      console.error('Failed to load customer:', error);
      alert('ไม่สามารถโหลดข้อมูลลูกค้าได้');
      router.push('/customers');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await customersApi.getStatistics(customerId);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm('คุณต้องการลบลูกค้านี้ใช่หรือไม่?')) return;

    try {
      await customersApi.remove(customerId, user.id);
      alert('ลบลูกค้าสำเร็จ');
      router.push('/customers');
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      alert(error.response?.data?.message || 'ไม่สามารถลบลูกค้าได้');
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
      <MainLayout title="ข้อมูลลูกค้า" subtitle="Customer Detail" showBackButton={true}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout title="ไม่พบข้อมูล" subtitle="Not Found" showBackButton={true}>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-foreground">ไม่พบข้อมูลลูกค้า</h3>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={customer.name} subtitle={`รหัส: ${customer.code}`} showBackButton={true}>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                TYPE_COLORS[customer.type]
              }`}
            >
              {TYPE_LABELS[customer.type]}
            </span>
            {!customer.isActive && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-red-100 text-red-700 border-red-300">
                ไม่ใช้งาน
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/pre-call-plans/create?customerId=${customerId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              สร้าง Pre-Call Plan
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              ลบ
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-muted-foreground">แผนการเยี่ยม</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{statistics.totalPlans}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-muted-foreground">รายงานการเยี่ยม</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{statistics.totalReports}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-muted-foreground">เยี่ยมล่าสุด</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {statistics.lastVisit
                  ? format(new Date(statistics.lastVisit), 'd MMM yyyy', { locale: th })
                  : 'ยังไม่มี'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-muted-foreground">แผนถัดไป</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {statistics.nextPlannedVisit
                  ? format(new Date(statistics.nextPlannedVisit), 'd MMM yyyy', { locale: th })
                  : 'ยังไม่มี'}
              </p>
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">ข้อมูลลูกค้า</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ชื่อลูกค้า</label>
              <p className="text-foreground">{customer.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">รหัสลูกค้า</label>
              <p className="text-foreground">{customer.code}</p>
            </div>
            {customer.monthlyRevenue !== undefined && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">รายได้ต่อเดือน</label>
                <p className="text-foreground">
                  {Number(customer.monthlyRevenue).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  บาท
                </p>
              </div>
            )}
            {customer.territory && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">เขตการขาย</label>
                <p className="text-foreground">{customer.territory.nameTh}</p>
              </div>
            )}
            {customer.phone && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">เบอร์โทร</label>
                <p className="text-foreground">{customer.phone}</p>
              </div>
            )}
            {customer.address && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">ที่อยู่</label>
                <p className="text-foreground">{customer.address}</p>
                {(customer.district || customer.province || customer.postalCode) && (
                  <p className="text-foreground mt-1">
                    {[customer.district, customer.province, customer.postalCode].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
            )}
            {customer.requiredVisitsPerMonth !== undefined && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  จำนวนครั้งที่ต้องเยี่ยมต่อเดือน
                </label>
                <p className="text-foreground">{customer.requiredVisitsPerMonth} ครั้ง</p>
              </div>
            )}
            {customer.responseTimeHours !== undefined && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  เวลาตอบกลับที่ต้องการ
                </label>
                <p className="text-foreground">{customer.responseTimeHours} ชั่วโมง</p>
              </div>
            )}
          </div>
        </div>

        {/* Contacts List */}
        {customer.contacts && customer.contacts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">รายชื่อผู้ติดต่อ</h2>
            <div className="space-y-3">
              {customer.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{contact.name}</h3>
                      {contact.isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          ผู้ติดต่อหลัก
                        </span>
                      )}
                    </div>
                    {contact.position && <p className="text-sm text-muted-foreground mb-2">{contact.position}</p>}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {contact.phone && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-foreground">{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-foreground">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GPS Location */}
        {customer.lat && customer.lng && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">ตำแหน่งที่ตั้ง</h2>
              <button
                onClick={() => openInGoogleMaps(Number(customer.lat), Number(customer.lng), customer.name)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                เปิดใน Google Maps
              </button>
            </div>

            {/* Distance from current location */}
            {currentLocation && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">ระยะห่างจากตำแหน่งปัจจุบัน</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatDistance(
                        calculateDistance(
                          currentLocation.lat,
                          currentLocation.lng,
                          Number(customer.lat),
                          Number(customer.lng)
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Get current location button */}
            {!currentLocation && (
              <div className="mb-4">
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      กำลังระบุตำแหน่ง...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      คำนวณระยะห่างจากตำแหน่งปัจจุบัน
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Map */}
            <div className="mb-4">
              <LocationMap
                lat={Number(customer.lat)}
                lng={Number(customer.lng)}
                zoom={15}
                readOnly={true}
                height="300px"
                showCoordinates={true}
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-border">
                <label className="block text-xs font-medium text-muted-foreground mb-1">ละติจูด (Latitude)</label>
                <p className="text-sm font-mono text-foreground">{Number(customer.lat).toFixed(6)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-border">
                <label className="block text-xs font-medium text-muted-foreground mb-1">ลองจิจูด (Longitude)</label>
                <p className="text-sm font-mono text-foreground">{Number(customer.lng).toFixed(6)}</p>
              </div>
            </div>
          </div>
        )}

        {/* No GPS Location */}
        {(!customer.lat || !customer.lng) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">ยังไม่มีข้อมูลตำแหน่ง GPS</h3>
                <p className="text-sm text-yellow-700">
                  ลูกค้ารายนี้ยังไม่มีพิกัด GPS ที่บันทึกไว้ คุณสามารถเพิ่มข้อมูลตำแหน่งได้ในภายหลัง
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Created By */}
        {customer.creator && (
          <div className="bg-gray-50 rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>สร้างโดย: {customer.creator.fullName}</span>
              <span className="mx-1">•</span>
              <span>{format(new Date(customer.createdAt), 'd MMM yyyy HH:mm', { locale: th })}</span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
