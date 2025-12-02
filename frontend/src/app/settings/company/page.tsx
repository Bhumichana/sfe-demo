'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  storageUsedMb: number;
  storageLimitMb: number;
}

export default function CompanySettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    district: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Only admin/CEO can access
    if (user.role !== 'CEO' && user.role !== 'SD') {
      router.push('/');
      return;
    }

    fetchCompanyData();
  }, [user, router]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${apiUrl}/company/${user?.companyId}`);

      setCompany(response.data);
      setFormData({
        name: response.data.name || '',
        taxId: response.data.taxId || '',
        address: response.data.address || '',
        district: response.data.district || '',
        province: response.data.province || '',
        postalCode: response.data.postalCode || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        website: response.data.website || '',
        logoUrl: response.data.logoUrl || '',
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
      alert('ไม่สามารถโหลดข้อมูลบริษัทได้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploadingLogo(true);

      // Upload to Vercel Blob
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await axios.post('/api/upload-avatar', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { url } = uploadResponse.data;
      setFormData(prev => ({ ...prev, logoUrl: url }));

      alert('อัพโหลดโลโก้สำเร็จ');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('ไม่สามารถอัพโหลดโลโก้ได้');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      await axios.patch(`${apiUrl}/company/${user?.companyId}`, formData);

      alert('บันทึกข้อมูลสำเร็จ');
      router.push('/settings');
    } catch (error) {
      console.error('Error saving company data:', error);
      alert('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="ข้อมูลบริษัท" subtitle="Company" showBackButton={true}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="ข้อมูลบริษัท" subtitle="Company" showBackButton={true}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Section */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">โลโก้บริษัท</h3>
          <div className="flex items-center gap-6">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Company Logo"
                className="w-32 h-32 object-contain border-2 border-border rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <label className="block">
                <span className="sr-only">Choose logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    file:cursor-pointer cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="mt-2 text-sm text-muted-foreground">
                รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                ชื่อบริษัท <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                เลขผู้เสียภาษี
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                maxLength={13}
                placeholder="0123456789012"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                โทรศัพท์
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="02-123-4567"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                อีเมล
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                เว็บไซต์
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.company.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">ที่อยู่</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                ที่อยู่
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                placeholder="เลขที่, ถนน, ซอย"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  อำเภอ/เขต
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="บางนา"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  จังหวัด
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="กรุงเทพมหานคร"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  maxLength={5}
                  placeholder="10260"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        {company && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">พื้นที่จัดเก็บข้อมูล</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ใช้ไปแล้ว</span>
                <span className="font-medium text-foreground">
                  {company.storageUsedMb.toLocaleString()} MB / {company.storageLimitMb.toLocaleString()} MB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(company.storageUsedMb / company.storageLimitMb) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                เหลืออีก {(company.storageLimitMb - company.storageUsedMb).toLocaleString()} MB
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="px-6 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </MainLayout>
  );
}
