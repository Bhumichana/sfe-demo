'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { usersApi } from '@/services/api';

interface Territory {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
}

interface Manager {
  id: string;
  fullName: string;
  role: string;
}

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuthStore();

  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [potentialManagers, setPotentialManagers] = useState<Manager[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'SR',
    territoryId: '',
    managerId: '',
    password: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchTerritories();
      fetchPotentialManagers();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const data = await usersApi.findOne(userId);
      setFormData({
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || '',
        role: data.role,
        territoryId: data.territory?.id || '',
        managerId: data.manager?.id || '',
        password: '', // Don't populate password
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('ไม่สามารถโหลดข้อมูล user ได้');
      router.push('/settings/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTerritories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/territories`);
      if (response.ok) {
        const data = await response.json();
        setTerritories(data);
      }
    } catch (error) {
      console.error('Error fetching territories:', error);
    }
  };

  const fetchPotentialManagers = async () => {
    try {
      if (!currentUser) return;
      const users = await usersApi.findAll({ companyId: currentUser.companyId, isActive: true });
      // Filter out non-manager roles and the user being edited
      const managers = users.filter(
        (u) => ['CEO', 'SD', 'SM', 'MM', 'PM', 'SUP'].includes(u.role) && u.id !== userId
      );
      setPotentialManagers(managers);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = 'กรุณากรอก Username';
    if (!formData.email.trim()) newErrors.email = 'กรุณากรอก Email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบ Email ไม่ถูกต้อง';
    }
    if (!formData.fullName.trim()) newErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    if (!formData.role) newErrors.role = 'กรุณาเลือกตำแหน่ง';

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const updateData: any = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: formData.role,
        territoryId: formData.territoryId || undefined,
        managerId: formData.managerId || undefined,
        isActive: formData.isActive,
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      await usersApi.update(userId, updateData);
      alert('บันทึกข้อมูลสำเร็จ');
      router.push(`/settings/users/${userId}`);
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="แก้ไขข้อมูลผู้ใช้งาน" subtitle="Edit User" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="แก้ไขข้อมูลผู้ใช้งาน" subtitle="Edit User" showBackButton={true}>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลทั่วไป</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.username ? 'border-error' : 'border-border'
                  }`}
                  placeholder="john.doe"
                />
                {errors.username && <p className="text-error text-sm mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.email ? 'border-error' : 'border-border'
                  }`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ชื่อ-นามสกุล <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.fullName ? 'border-error' : 'border-border'
                  }`}
                  placeholder="สมชาย ใจดี"
                />
                {errors.fullName && <p className="text-error text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="081-234-5678"
                />
              </div>
            </div>
          </div>

          {/* Role & Organization */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">ตำแหน่งและองค์กร</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ตำแหน่ง <span className="text-error">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.role ? 'border-error' : 'border-border'
                  }`}
                >
                  <option value="">เลือกตำแหน่ง</option>
                  <option value="CEO">CEO</option>
                  <option value="SD">Sale Director (SD)</option>
                  <option value="SM">Sales Manager (SM)</option>
                  <option value="MM">Marketing Manager (MM)</option>
                  <option value="PM">Product Manager (PM)</option>
                  <option value="SUP">Supervisor (SUP)</option>
                  <option value="SR">Sales Rep (SR)</option>
                </select>
                {errors.role && <p className="text-error text-sm mt-1">{errors.role}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">เขตพื้นที่</label>
                <select
                  name="territoryId"
                  value={formData.territoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">ไม่ระบุ</option>
                  {territories.map((territory) => (
                    <option key={territory.id} value={territory.id}>
                      {territory.nameTh} ({territory.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">ผู้จัดการ</label>
                <select
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">ไม่มีผู้จัดการ</option>
                  {potentialManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.fullName} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">เปลี่ยนรหัสผ่าน</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.password ? 'border-error' : 'border-border'
                }`}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
              {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">สถานะ</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="ml-2 text-sm text-foreground">เปิดใช้งาน (Active)</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/settings/users/${userId}`)}
              className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-gray-50 transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
