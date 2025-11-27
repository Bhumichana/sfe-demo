'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { territoriesApi } from '@/services/api';

export default function TerritoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuthStore();
  const [territory, setTerritory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const territoryId = params?.id as string;

  useEffect(() => {
    if (territoryId) {
      fetchTerritory();
    }
  }, [territoryId]);

  const fetchTerritory = async () => {
    try {
      setLoading(true);
      const data = await territoriesApi.findOne(territoryId);
      setTerritory(data);
    } catch (error) {
      console.error('Error fetching territory:', error);
      alert('ไม่สามารถโหลดข้อมูลเขตพื้นที่ได้');
      router.push('/settings/territories');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      await territoriesApi.activate(territoryId);
      fetchTerritory();
    } catch (error) {
      console.error('Error activating territory:', error);
      alert('ไม่สามารถเปิดใช้งานเขตพื้นที่ได้');
    }
  };

  const handleDeactivate = async () => {
    if (confirm('คุณต้องการปิดใช้งานเขตพื้นที่นี้ใช่หรือไม่?')) {
      try {
        await territoriesApi.remove(territoryId);
        fetchTerritory();
      } catch (error: any) {
        console.error('Error deactivating territory:', error);
        alert(error.response?.data?.message || 'ไม่สามารถปิดใช้งานเขตพื้นที่ได้');
      }
    }
  };

  if (loading || !territory) {
    return (
      <MainLayout title="รายละเอียดเขตพื้นที่" subtitle="Territory Detail" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="รายละเอียดเขตพื้นที่" subtitle="Territory Detail" showBackButton={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{territory.nameTh}</h2>
            <p className="text-sm text-muted-foreground">{territory.nameEn} • รหัส: {territory.code}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/settings/territories')}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors"
            >
              กลับ
            </button>
            <button
              onClick={() => router.push(`/settings/territories/${territoryId}/edit`)}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
            >
              แก้ไข
            </button>
            {territory.isActive ? (
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
              >
                ปิดใช้งาน
              </button>
            ) : (
              <button
                onClick={handleActivate}
                className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors"
              >
                เปิดใช้งาน
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">รหัสเขต</label>
              <p className="text-foreground">{territory.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ชื่อภาษาไทย</label>
              <p className="text-foreground">{territory.nameTh}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ชื่อภาษาอังกฤษ</label>
              <p className="text-foreground">{territory.nameEn}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">สถานะ</label>
              {territory.isActive ? (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-success/10 text-success">
                  ใช้งานอยู่
                </span>
              ) : (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-600">
                  ปิดใช้งาน
                </span>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">คำอธิบาย</label>
              <p className="text-foreground">{territory.description || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">จังหวัด</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {territory.provinces && territory.provinces.length > 0 ? (
                  territory.provinces.map((province: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700"
                    >
                      {province}
                    </span>
                  ))
                ) : (
                  <p className="text-foreground">-</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Users</p>
                <p className="text-3xl font-bold text-foreground">{territory._count?.users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customers</p>
                <p className="text-3xl font-bold text-foreground">{territory._count?.customers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users in Territory */}
        {territory.users && territory.users.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Users ในเขตพื้นที่ ({territory.users.length} คน)
            </h3>
            <div className="space-y-3">
              {territory.users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/settings/users/${user.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {user.role}
                    </span>
                    {user.isActive ? (
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

        {/* Customers in Territory */}
        {territory.customers && territory.customers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Customers ในเขตพื้นที่ ({territory.customers.length} ราย)
            </h3>
            <div className="space-y-3">
              {territory.customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                      {customer.type}
                    </span>
                    {customer.isActive ? (
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
      </div>
    </MainLayout>
  );
}
