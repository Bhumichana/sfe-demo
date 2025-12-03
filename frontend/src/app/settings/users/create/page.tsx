'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { usersApi, teamsApi } from '@/services/api';

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

interface Team {
  id: string;
  code: string;
  name: string;
  leader?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export default function UserCreatePage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [potentialManagers, setPotentialManagers] = useState<Manager[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'SR',
    territoryId: '',
    managerId: '',
    teamId: '',
    password: '',
    confirmPassword: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTerritories();
    fetchPotentialManagers();
    fetchTeams();
  }, []);

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
      // Filter manager roles
      const managers = users.filter((u) => ['CEO', 'SD', 'SM', 'MM', 'PM', 'SUP'].includes(u.role));
      setPotentialManagers(managers);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      if (!currentUser) return;
      const data = await teamsApi.findAll({ companyId: currentUser.companyId, isActive: true });
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
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
    if (formData.username.length < 3) newErrors.username = 'Username ต้องมีอย่างน้อย 3 ตัวอักษร';

    if (!formData.email.trim()) newErrors.email = 'กรุณากรอก Email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบ Email ไม่ถูกต้อง';
    }

    if (!formData.fullName.trim()) newErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    if (!formData.role) newErrors.role = 'กรุณาเลือกตำแหน่ง';

    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser || !currentUser.companyId) {
      alert('ไม่สามารถระบุ Company ID ได้');
      return;
    }

    try {
      setSaving(true);

      const createData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: formData.role,
        companyId: currentUser.companyId,
        territoryId: formData.territoryId || undefined,
        managerId: formData.managerId || undefined,
        teamId: formData.teamId || undefined,
        password: formData.password,
        isActive: formData.isActive,
      };

      const newUser = await usersApi.create(createData);
      alert('สร้าง User สำเร็จ');
      router.push(`/settings/users/${newUser.id}`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || 'ไม่สามารถสร้าง User ได้';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="เพิ่มผู้ใช้งานใหม่" subtitle="Create New User" showBackButton={true}>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">ทีม</label>
                <select
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">ไม่ระบุ</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.code})
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

          {/* Password */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">ตั้งรหัสผ่าน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  รหัสผ่าน <span className="text-error">*</span>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ยืนยันรหัสผ่าน <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.confirmPassword ? 'border-error' : 'border-border'
                  }`}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                />
                {errors.confirmPassword && <p className="text-error text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
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
              onClick={() => router.push('/settings/users')}
              className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-gray-50 transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  สร้าง User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
