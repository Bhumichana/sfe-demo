'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { customersApi, territoriesApi } from '@/services/api';
import { CreateCustomerDto, Territory } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), {
  ssr: false,
});

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [territories, setTerritories] = useState<Territory[]>([]);

  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    code: '',
    monthlyRevenue: undefined,
    address: '',
    district: '',
    province: '',
    postalCode: '',
    phone: '',
    territoryId: '',
    requiredVisitsPerMonth: undefined,
    responseTimeHours: undefined,
    lat: undefined,
    lng: undefined,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, customerId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [customerData, territoriesData] = await Promise.all([
        customersApi.findOne(customerId),
        territoriesApi.findAll(),
      ]);

      setTerritories(territoriesData);
      setFormData({
        name: customerData.name || '',
        code: customerData.code || '',
        monthlyRevenue: customerData.monthlyRevenue,
        address: customerData.address || '',
        district: customerData.district || '',
        province: customerData.province || '',
        postalCode: customerData.postalCode || '',
        phone: customerData.phone || '',
        territoryId: customerData.territory?.id || '',
        requiredVisitsPerMonth: customerData.requiredVisitsPerMonth,
        responseTimeHours: customerData.responseTimeHours,
        lat: customerData.lat,
        lng: customerData.lng,
      });
    } catch (error) {
      console.error('Failed to load customer data:', error);
      alert('ไม่สามารถโหลดข้อมูลลูกค้าได้');
      router.push('/customers');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }

    try {
      setLoading(true);

      // Prepare data
      const customerData: CreateCustomerDto = {
        ...formData,
        code: formData.code?.trim() || undefined,
        territoryId: formData.territoryId || undefined,
        lat: formData.lat,
        lng: formData.lng,
      };

      await customersApi.update(customerId, user!.id, customerData);
      alert('แก้ไขข้อมูลลูกค้าสำเร็จ');
      router.push(`/customers/${customerId}`);
    } catch (error: any) {
      console.error('Failed to update customer:', error);
      alert(error.response?.data?.message || 'ไม่สามารถแก้ไขข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout title="แก้ไขข้อมูลลูกค้า" subtitle="Edit Customer" showBackButton={true}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ชื่อลูกค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="ระบุชื่อลูกค้า"
              />
            </div>

            {/* Customer Code */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                รหัสลูกค้า <span className="text-sm text-muted-foreground">(ถ้าไม่ระบุจะสร้างอัตโนมัติ)</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="เช่น CUST0001"
              />
            </div>

            {/* Monthly Revenue */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                รายได้ต่อเดือน (บาท){' '}
                <span className="text-sm text-muted-foreground">(ใช้คำนวณระดับลูกค้า)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyRevenue || ''}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyRevenue: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
              />
              <p className="mt-1.5 text-sm text-muted-foreground">
                A (VIP): &gt; 500,000 | B (Important): 100,000-500,000 | C (Standard): &lt; 100,000
              </p>
            </div>

            {/* Territory */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">เขตการขาย</label>
              <select
                value={formData.territoryId}
                onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- ไม่ระบุ --</option>
                {territories.map((territory) => (
                  <option key={territory.id} value={territory.id}>
                    {territory.nameTh} ({territory.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">ข้อมูลการติดต่อ</h2>
          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">เบอร์โทร</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0812345678"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">ที่อยู่</label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="ระบุที่อยู่"
              />
            </div>

            {/* District, Province, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">อำเภอ/เขต</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="เช่น บางรัก"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">จังหวัด</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="เช่น กรุงเทพฯ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">รหัสไปรษณีย์</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="10500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location (GPS) */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">📍 ตำแหน่งที่ตั้ง (GPS)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            เพิ่มตำแหน่ง GPS เพื่อใช้สำหรับ Check-in และแผนที่
          </p>
          <LocationPicker
            initialLat={formData.lat}
            initialLng={formData.lng}
            onLocationChange={(lat, lng) => {
              setFormData({ ...formData, lat, lng });
            }}
            height="400px"
          />
        </div>

        {/* Service Level Requirements */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">ความต้องการในการบริการ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                จำนวนครั้งที่ต้องเยี่ยมต่อเดือน
              </label>
              <input
                type="number"
                min="0"
                value={formData.requiredVisitsPerMonth || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiredVisitsPerMonth: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                เวลาตอบกลับที่ต้องการ (ชั่วโมง)
              </label>
              <input
                type="number"
                min="0"
                value={formData.responseTimeHours || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responseTimeHours: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/customers/${customerId}`)}
            className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </MainLayout>
  );
}
