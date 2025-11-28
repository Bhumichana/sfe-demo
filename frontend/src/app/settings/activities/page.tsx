'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import MainLayout from '@/components/layouts/MainLayout';

interface ActivityType {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  category: string | null;
  requiresPhoto: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const url = filter === 'active'
        ? 'http://localhost:3001/api/activity-types?activeOnly=true'
        : 'http://localhost:3001/api/activity-types';

      const response = await axios.get(url);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบ "${name}" ใช่หรือไม่?\n\nการลบจะไม่สามารถกู้คืนได้`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/activity-types/${id}`);
      alert('ลบ Activity Type สำเร็จ');
      fetchActivities();
    } catch (error: any) {
      console.error('Error deleting activity type:', error);
      alert(error.response?.data?.message || 'ไม่สามารถลบ Activity Type ได้');
    }
  };

  const categoryColors: Record<string, string> = {
    PRESENTATION: 'bg-blue-100 text-blue-700',
    MERCHANDISING: 'bg-purple-100 text-purple-700',
    SALES: 'bg-green-100 text-green-700',
    MARKETING: 'bg-pink-100 text-pink-700',
    SUPPORT: 'bg-yellow-100 text-yellow-700',
    INVENTORY: 'bg-orange-100 text-orange-700',
    FINANCE: 'bg-red-100 text-red-700',
    RELATIONSHIP: 'bg-indigo-100 text-indigo-700',
    PLANNING: 'bg-teal-100 text-teal-700',
  };

  return (
    <MainLayout
      title="จัดการ Activity Types"
      subtitle="Manage Activity Types"
      showBackButton={true}
      backUrl="/settings"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/settings/activities/create')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่ม Activity Type
          </button>
          <div className="text-sm text-muted-foreground">
            ทั้งหมด: <span className="font-semibold text-foreground">{activities.length}</span> รายการ
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-2 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-gray-100'
            }`}
          >
            ทั้งหมด ({activities.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-gray-100'
            }`}
          >
            ใช้งานอยู่
          </button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="text-2xl font-bold text-foreground">{activities.length}</div>
            <div className="text-sm text-muted-foreground">รายการทั้งหมด</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="text-2xl font-bold text-success">
              {activities.filter(a => a.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">ใช้งานอยู่</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="text-2xl font-bold text-warning">
              {activities.filter(a => a.requiresPhoto).length}
            </div>
            <div className="text-sm text-muted-foreground">ต้องถ่ายรูป</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border p-4">
            <div className="text-2xl font-bold text-info">
              {new Set(activities.map(a => a.category).filter(Boolean)).size}
            </div>
            <div className="text-sm text-muted-foreground">หมวดหมู่</div>
          </div>
        </div>

        {/* Activities List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{activity.nameTh}</h3>
                      {activity.category && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[activity.category] || 'bg-gray-100 text-gray-700'}`}>
                          {activity.category}
                        </span>
                      )}
                      {activity.requiresPhoto && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          ถ่ายรูป
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{activity.nameEn}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: <span className="font-mono font-medium">{activity.code}</span>
                      {' • '}
                      Sort: {activity.sortOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${activity.isActive ? 'bg-success' : 'bg-error'}`} />
                    <span className={`text-xs font-medium ${activity.isActive ? 'text-success' : 'text-error'}`}>
                      {activity.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => router.push(`/settings/activities/${activity.id}/edit`)}
                    className="flex-1 px-3 py-2 text-sm bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id, activity.nameTh)}
                    className="flex-1 px-3 py-2 text-sm bg-error text-white rounded-lg hover:bg-error/90 transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    ลบ
                  </button>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-muted-foreground">ไม่พบรายการ Activity</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
