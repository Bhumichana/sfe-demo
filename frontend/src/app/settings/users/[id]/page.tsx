'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { usersApi } from '@/services/api';
import { format } from 'date-fns';

interface UserDetail {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  territory?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string;
  };
  manager?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  company: {
    id: string;
    name: string;
  };
  subordinates?: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  _count?: {
    preCallPlans: number;
    callReports: number;
    customersCreated: number;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = params?.id as string;

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const data = await usersApi.findOne(userId);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      alert('ไม่สามารถโหลดข้อมูล user ได้');
      router.push('/settings/users');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async () => {
    if (!user) return;
    try {
      await usersApi.activate(user.id);
      await fetchUserDetail();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('ไม่สามารถเปิดใช้งาน user ได้');
    }
  };

  const handleDeactivateUser = async () => {
    if (!user) return;
    if (confirm('คุณต้องการปิดใช้งาน user นี้ใช่หรือไม่?')) {
      try {
        await usersApi.remove(user.id);
        await fetchUserDetail();
      } catch (error) {
        console.error('Error deactivating user:', error);
        alert('ไม่สามารถปิดใช้งาน user ได้');
      }
    }
  };

  const roleLabels: Record<string, string> = {
    CEO: 'CEO',
    SD: 'Sale Director',
    SM: 'Sales Manager',
    MM: 'Marketing Manager',
    PM: 'Product Manager',
    SUP: 'Supervisor',
    SR: 'Sales Rep',
  };

  const roleColors: Record<string, string> = {
    CEO: 'bg-purple-100 text-purple-700',
    SD: 'bg-indigo-100 text-indigo-700',
    SM: 'bg-green-100 text-green-700',
    MM: 'bg-red-100 text-red-700',
    PM: 'bg-orange-100 text-orange-700',
    SUP: 'bg-blue-100 text-blue-700',
    SR: 'bg-gray-100 text-gray-700',
  };

  if (loading) {
    return (
      <MainLayout title="รายละเอียดผู้ใช้งาน" subtitle="User Detail" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout title="รายละเอียดผู้ใช้งาน" subtitle="User Detail" showBackButton={true}>
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูล user</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="รายละเอียดผู้ใช้งาน" subtitle="User Detail" showBackButton={true}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 gradient-gold rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/settings/users')}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              กลับ
            </button>
            <button
              onClick={() => router.push(`/settings/users/${user.id}/edit`)}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              แก้ไข
            </button>
            {user.isActive ? (
              <button
                onClick={handleDeactivateUser}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors font-medium"
                disabled={user.id === currentUser?.id}
              >
                ปิดใช้งาน
              </button>
            ) : (
              <button
                onClick={handleActivateUser}
                className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors font-medium"
              >
                เปิดใช้งาน
              </button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Username</label>
              <p className="text-foreground">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <p className="text-foreground">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ชื่อ-นามสกุล</label>
              <p className="text-foreground">{user.fullName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">เบอร์โทรศัพท์</label>
              <p className="text-foreground">{user.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ตำแหน่ง</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${roleColors[user.role]}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">สถานะ</label>
              {user.isActive ? (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-success/10 text-success">
                  ใช้งานอยู่
                </span>
              ) : (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-600">
                  ปิดใช้งาน
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลองค์กร</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">บริษัท</label>
              <p className="text-foreground">{user.company.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">เขตพื้นที่</label>
              <p className="text-foreground">
                {user.territory ? `${user.territory.nameTh} (${user.territory.code})` : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ผู้จัดการ</label>
              <p className="text-foreground">
                {user.manager ? (
                  <span>
                    {user.manager.fullName}
                    <span className="text-xs text-muted-foreground ml-2">({roleLabels[user.manager.role]})</span>
                  </span>
                ) : (
                  '-'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Subordinates */}
        {user.subordinates && user.subordinates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              ทีมงาน ({user.subordinates.length} คน)
            </h3>
            <div className="space-y-3">
              {user.subordinates.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/settings/users/${sub.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                      {sub.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sub.fullName}</p>
                      <p className="text-sm text-muted-foreground">{sub.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[sub.role]}`}>
                      {roleLabels[sub.role]}
                    </span>
                    {sub.isActive ? (
                      <span className="w-2 h-2 bg-success rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        {user._count && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">สถิติการทำงาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="text-3xl font-bold text-primary">{user._count.preCallPlans}</p>
                <p className="text-sm text-muted-foreground mt-1">Pre-Call Plans</p>
              </div>
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <p className="text-3xl font-bold text-success">{user._count.callReports}</p>
                <p className="text-sm text-muted-foreground mt-1">Call Reports</p>
              </div>
              <div className="text-center p-4 bg-info/5 rounded-lg">
                <p className="text-3xl font-bold text-info">{user._count.customersCreated}</p>
                <p className="text-sm text-muted-foreground mt-1">Customers Created</p>
              </div>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลระบบ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-muted-foreground mb-1">สร้างเมื่อ</label>
              <p className="text-foreground">{format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">แก้ไขล่าสุด</label>
              <p className="text-foreground">{format(new Date(user.updatedAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">เข้าระบบล่าสุด</label>
              <p className="text-foreground">
                {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm') : 'ยังไม่เคยเข้าระบบ'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
