'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { territoriesApi } from '@/services/api';

export default function CreateTerritoryPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    nameTh: '',
    nameEn: '',
    description: '',
    provinces: '' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameTh || !formData.nameEn) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    try {
      setLoading(true);
      const provincesArray = formData.provinces
        ? formData.provinces.split(',').map(p => p.trim()).filter(p => p)
        : [];

      await territoriesApi.create({
        ...formData,
        provinces: provincesArray,
        companyId: currentUser!.companyId,
      });

      alert('สร้างเขตพื้นที่สำเร็จ');
      router.push('/settings/territories');
    } catch (error: any) {
      console.error('Error creating territory:', error);
      alert(error.response?.data?.message || 'ไม่สามารถสร้างเขตพื้นที่ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="เพิ่มเขตพื้นที่ใหม่" subtitle="Create New Territory" showBackButton={true}>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              รหัสเขต <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="เช่น BKK1"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อภาษาไทย <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.nameTh}
              onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
              placeholder="เช่น กรุงเทพฯ เขตเหนือ"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อภาษาอังกฤษ <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="เช่น Bangkok North"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">คำอธิบาย</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              จังหวัด (คั่นด้วยเครื่องหมายจุลภาค)
            </label>
            <input
              type="text"
              value={formData.provinces}
              onChange={(e) => setFormData({ ...formData, provinces: e.target.value })}
              placeholder="เช่น กรุงเทพมหานคร, นนทบุรี"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/settings/territories')}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
