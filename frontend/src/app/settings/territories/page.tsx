'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { territoriesApi } from '@/services/api';

export default function TerritoriesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [territories, setTerritories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchTerritories();
    }
  }, [currentUser, selectedStatus]);

  const fetchTerritories = async () => {
    try {
      setLoading(true);
      const params: any = { companyId: currentUser?.companyId };
      if (selectedStatus === 'ACTIVE') params.isActive = true;
      else if (selectedStatus === 'INACTIVE') params.isActive = false;
      const data = await territoriesApi.findAll(params);
      setTerritories(data);
    } catch (error) {
      console.error('Error fetching territories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await territoriesApi.activate(id);
      fetchTerritories();
    } catch (error) {
      alert('ไม่สามารถเปิดใช้งานเขตพื้นที่ได้');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('คุณต้องการปิดใช้งานเขตพื้นที่นี้ใช่หรือไม่?')) {
      try {
        await territoriesApi.remove(id);
        fetchTerritories();
      } catch (error: any) {
        alert(error.response?.data?.message || 'ไม่สามารถปิดใช้งานเขตพื้นที่ได้');
      }
    }
  };

  const filteredTerritories = territories.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.code.toLowerCase().includes(q) || t.nameTh.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q);
  });

  return (
    <MainLayout title="จัดการเขตพื้นที่" subtitle="Territory Management" showBackButton={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/settings/territories/create')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มเขตพื้นที่
          </button>
          <div className="text-sm text-muted-foreground">
            ทั้งหมด: <span className="font-semibold text-foreground">{filteredTerritories.length}</span> เขต
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="รหัส, ชื่อภาษาไทย, ชื่อภาษาอังกฤษ..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="ACTIVE">ใช้งานอยู่</option>
                <option value="INACTIVE">ปิดใช้งาน</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredTerritories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">ไม่พบเขตพื้นที่</h3>
            <p className="text-sm text-gray-500">ลองเปลี่ยนตัวกรองหรือเพิ่มเขตพื้นที่ใหม่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerritories.map((territory) => (
              <div
                key={territory.id}
                className="bg-white rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/settings/territories/${territory.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{territory.nameTh}</h3>
                    <p className="text-sm text-muted-foreground">{territory.nameEn}</p>
                    <p className="text-xs text-muted-foreground mt-1">รหัส: {territory.code}</p>
                  </div>
                  {territory.isActive ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">ใช้งาน</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">ปิดใช้งาน</span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-foreground">{territory._count?.users || 0} users</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-foreground">{territory._count?.customers || 0} customers</span>
                  </div>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/settings/territories/${territory.id}/edit`); }}
                    className="flex-1 px-3 py-2 text-sm bg-warning text-white rounded-lg hover:bg-warning/90"
                  >
                    แก้ไข
                  </button>
                  {territory.isActive ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeactivate(territory.id); }}
                      className="flex-1 px-3 py-2 text-sm bg-error text-white rounded-lg hover:bg-error/90"
                    >
                      ปิดใช้งาน
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleActivate(territory.id); }}
                      className="flex-1 px-3 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/90"
                    >
                      เปิดใช้งาน
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
