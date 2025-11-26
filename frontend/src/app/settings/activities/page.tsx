'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import BottomNav from '@/components/BottomNav';

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
        ? 'http://localhost:3000/api/activity-types?activeOnly=true'
        : 'http://localhost:3000/api/activity-types';

      const response = await axios.get(url);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">จัดการ Activity Types</h1>
              <p className="text-xs text-muted-foreground">Manage Activity Types</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                <div className="flex items-start justify-between">
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
      </main>

      <BottomNav />
    </div>
  );
}
