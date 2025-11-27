'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { territoriesApi } from '@/services/api';

export default function EditTerritoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const territoryId = params?.id as string;

  const [formData, setFormData] = useState({
    code: '',
    nameTh: '',
    nameEn: '',
    description: '',
    provinces: '' as string,
  });

  useEffect(() => {
    if (territoryId && currentUser) {
      fetchTerritory();
    }
  }, [territoryId, currentUser]);

  const fetchTerritory = async () => {
    try {
      const data = await territoriesApi.findOne(territoryId);
      setFormData({
        code: data.code,
        nameTh: data.nameTh,
        nameEn: data.nameEn,
        description: data.description || '',
        provinces: data.provinces ? data.provinces.join(', ') : '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching territory:', error);
      alert('ไม่สามารถโหลดข้อมูลเขตพื้นที่ได้');
      router.push('/settings/territories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.nameTh || !formData.nameEn) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    try {
      setSaving(true);
      const provincesArray = formData.provinces
        ? formData.provinces.split(',').map(p => p.trim()).filter(p => p)
        : [];

      await territoriesApi.update(territoryId, {
        ...formData,
        provinces: provincesArray,
      });

      alert('แก้ไขเขตพื้นที่สำเร็จ');
      router.push(`/settings/territories/${territoryId}`);
    } catch (error: any) {
      console.error('Error updating territory:', error);
      alert(error.response?.data?.message || 'ไม่สามารถแก้ไขเขตพื้นที่ได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="แก้ไขเขตพื้นที่" subtitle="Edit Territory" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="แก้ไขเขตพื้นที่" subtitle="Edit Territory" showBackButton={true}>
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
              onClick={() => router.push(`/settings/territories/${territoryId}`)}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
