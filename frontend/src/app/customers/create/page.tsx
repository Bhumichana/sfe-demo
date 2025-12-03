'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { customersApi, territoriesApi } from '@/services/api';
import { CreateCustomerDto, Territory } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';

export default function CreateCustomerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loadingTerritories, setLoadingTerritories] = useState(true);
  const [showQuickContact, setShowQuickContact] = useState(false);

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
  });

  const [contactData, setContactData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadTerritories();
  }, [isAuthenticated]);

  const loadTerritories = async () => {
    try {
      setLoadingTerritories(true);
      const data = await territoriesApi.findAll();
      setTerritories(data);
    } catch (error) {
      console.error('Failed to load territories:', error);
      alert('ไม่สามารถโหลดข้อมูลเขตการขายได้');
    } finally {
      setLoadingTerritories(false);
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
        // Add quick contact if provided
        contact:
          showQuickContact && contactData.name.trim()
            ? {
                name: contactData.name.trim(),
                position: contactData.position?.trim() || undefined,
                phone: contactData.phone?.trim() || undefined,
                email: contactData.email?.trim() || undefined,
              }
            : undefined,
      };

      const customer = await customersApi.create(customerData);
      alert('เพิ่มลูกค้าสำเร็จ');
      router.push(`/customers/${customer.id}`);
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      alert(error.response?.data?.message || 'ไม่สามารถเพิ่มลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
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
    <MainLayout title="เพิ่มลูกค้าใหม่" subtitle="Create Customer" showBackButton={true}>
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
              {loadingTerritories ? (
                <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : (
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
              )}
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

        {/* Quick Create Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">เพิ่มผู้ติดต่อ (ถ้ามี)</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showQuickContact}
                onChange={(e) => setShowQuickContact(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {showQuickContact && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">ชื่อผู้ติดต่อ</label>
                <input
                  type="text"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={contactData.position}
                    onChange={(e) => setContactData({ ...contactData, position: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="เช่น ผู้จัดการ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">เบอร์โทร</label>
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="0812345678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">อีเมล</label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="example@email.com"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
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
