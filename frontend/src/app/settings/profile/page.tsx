'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { usersApi } from '@/services/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);

      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await uploadResponse.json();

      // Update user profile with new avatar URL
      await usersApi.update(user.id, {
        avatarUrl: url,
      });

      alert('อัปโหลดรูปภาพสำเร็จ');

      // Reload user data
      const updatedUser = await usersApi.findOne(user.id);
      localStorage.setItem('sfe_user', JSON.stringify(updatedUser));
      initAuth();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setLoading(true);

      await usersApi.update(user.id, {
        fullName: formData.fullName,
        phone: formData.phone || undefined,
      });

      alert('อัปเดตข้อมูลสำเร็จ');

      // Reload user data
      const updatedUser = await usersApi.findOne(user.id);
      localStorage.setItem('sfe_user', JSON.stringify(updatedUser));
      initAuth();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      setLoading(true);

      await usersApi.update(user.id, {
        password: passwordData.newPassword,
      });

      alert('เปลี่ยนรหัสผ่านสำเร็จ');
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  const roleNames: Record<string, string> = {
    CEO: 'Chief Executive Officer',
    SD: 'Sale Director',
    SM: 'Sales Manager',
    MM: 'Marketing Manager',
    PM: 'Product Manager',
    SUP: 'Supervisor',
    SR: 'Sales Representative',
  };

  if (!user) {
    return (
      <MainLayout title="โปรไฟล์" subtitle="Profile" showBackButton={true} backUrl="/settings">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="โปรไฟล์" subtitle="Profile" showBackButton={true} backUrl="/settings">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 gradient-gold rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.fullName.charAt(0)}
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                title="เปลี่ยนรูปโปรไฟล์"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{user.fullName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
                  {roleNames[user.role] || user.role}
                </span>
                {user.isActive ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-success/10 text-success font-medium text-sm">
                    ✓ Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-error/10 text-error font-medium text-sm">
                    ✗ Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลส่วนตัว</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ชื่อ-นามสกุล <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812345678"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>

        {/* Read-only Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลระบบ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Username</label>
              <div className="px-4 py-2 bg-gray-50 border border-border rounded-lg text-foreground">
                {user.username}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">อีเมล</label>
              <div className="px-4 py-2 bg-gray-50 border border-border rounded-lg text-foreground">
                {user.email}
              </div>
            </div>

            {/* Territory */}
            {user.territory && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">เขตพื้นที่</label>
                <div className="px-4 py-2 bg-gray-50 border border-border rounded-lg text-foreground">
                  {user.territory.nameTh} ({user.territory.code})
                </div>
              </div>
            )}

            {/* Company */}
            {user.company && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">บริษัท</label>
                <div className="px-4 py-2 bg-gray-50 border border-border rounded-lg text-foreground">
                  {user.company.name}
                </div>
              </div>
            )}

            {/* Last Login */}
            {user.lastLogin && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">เข้าสู่ระบบล่าสุด</label>
                <div className="px-4 py-2 bg-gray-50 border border-border rounded-lg text-foreground">
                  {new Date(user.lastLogin).toLocaleString('th-TH')}
                </div>
              </div>
            )}

            {/* Created At */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">สร้างเมื่อ</label>
              <div className="px-4 py-2 bg-gray-50 border border-border rounded-lg text-foreground">
                {new Date(user.createdAt).toLocaleString('th-TH')}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">เปลี่ยนรหัสผ่าน</h3>

          {!showChangePassword ? (
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors font-medium"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  รหัสผ่านใหม่ <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ยืนยันรหัสผ่านใหม่ <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
