'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import axios from 'axios';

export default function CreateActivityTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    nameTh: '',
    nameEn: '',
    category: '',
    requiresPhoto: false,
    isActive: true,
    sortOrder: 0,
  });

  const categories = [
    { value: '', label: '-- เลือกหมวดหมู่ --' },
    { value: 'PRESENTATION', label: 'นำเสนอสินค้า (Presentation)' },
    { value: 'MERCHANDISING', label: 'จัดวางสินค้า (Merchandising)' },
    { value: 'SALES', label: 'การขาย (Sales)' },
    { value: 'MARKETING', label: 'การตลาด (Marketing)' },
    { value: 'SUPPORT', label: 'สนับสนุน (Support)' },
    { value: 'INVENTORY', label: 'สต็อก/คลังสินค้า (Inventory)' },
    { value: 'FINANCE', label: 'การเงิน (Finance)' },
    { value: 'RELATIONSHIP', label: 'สร้างความสัมพันธ์ (Relationship)' },
    { value: 'PLANNING', label: 'วางแผน (Planning)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.nameTh || !formData.nameEn) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รหัส, ชื่อภาษาไทย, ชื่อภาษาอังกฤษ)');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        category: formData.category || undefined,
      };

      await axios.post('http://localhost:3001/api/activity-types', payload);

      alert('เพิ่ม Activity Type สำเร็จ');
      router.push('/settings/activities');
    } catch (error: any) {
      console.error('Error creating activity type:', error);
      alert(error.response?.data?.message || 'ไม่สามารถเพิ่ม Activity Type ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="เพิ่ม Activity Type ใหม่"
      subtitle="Create New Activity Type"
      showBackButton={true}
      backUrl="/settings/activities"
    >
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              รหัส Activity Type <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="เช่น DETAIL_PRODUCT"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">ใช้ตัวพิมพ์ใหญ่และขีดล่าง เช่น DETAIL_PRODUCT</p>
          </div>

          {/* Thai Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อภาษาไทย <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.nameTh}
              onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
              placeholder="เช่น Detail product"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* English Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อภาษาอังกฤษ <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="เช่น Detail product"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              หมวดหมู่
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ลำดับการเรียง
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">ตัวเลขน้อยจะแสดงก่อน</p>
          </div>

          {/* Requires Photo */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="requiresPhoto"
              checked={formData.requiresPhoto}
              onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
              className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="requiresPhoto" className="text-sm font-medium text-foreground cursor-pointer">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ต้องถ่ายรูป
              </div>
              <p className="text-xs text-muted-foreground mt-1">กิจกรรมนี้ต้องมีการถ่ายรูปหรือไม่</p>
            </label>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-success' : 'bg-error'}`} />
                ใช้งานทันที
              </div>
              <p className="text-xs text-muted-foreground mt-1">กิจกรรมนี้สามารถใช้งานได้ทันทีหรือไม่</p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/settings/activities')}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
