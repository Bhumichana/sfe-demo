'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { teamsApi } from '@/services/api';

interface Team {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  leader?: {
    id: string;
    fullName: string;
    role: string;
  };
  company: {
    id: string;
    name: string;
  };
  _count?: {
    members: number;
  };
  createdAt: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchTeams();
    }
  }, [currentUser, selectedStatus]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params: any = {
        companyId: currentUser?.companyId,
      };

      if (selectedStatus === 'ACTIVE') {
        params.isActive = true;
      } else if (selectedStatus === 'INACTIVE') {
        params.isActive = false;
      }

      const data = await teamsApi.findAll(params);
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTeam = async (teamId: string) => {
    try {
      await teamsApi.activate(teamId);
      fetchTeams();
    } catch (error) {
      console.error('Error activating team:', error);
      alert('ไม่สามารถเปิดใช้งานทีมได้');
    }
  };

  const handleDeactivateTeam = async (teamId: string) => {
    if (confirm('คุณต้องการปิดใช้งานทีมนี้ใช่หรือไม่?')) {
      try {
        await teamsApi.remove(teamId);
        fetchTeams();
      } catch (error: any) {
        console.error('Error deactivating team:', error);
        alert(error.response?.data?.message || 'ไม่สามารถปิดใช้งานทีมได้');
      }
    }
  };

  const filteredTeams = teams.filter(team => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(query) ||
      team.code.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout title="จัดการทีม" subtitle="Team Management" showBackButton={true}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/settings/teams/create')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มทีม
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            ทั้งหมด: <span className="font-semibold text-foreground">{filteredTeams.length}</span> ทีม
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ชื่อทีม, รหัสทีม..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
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

        {/* Teams List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">ไม่พบทีม</h3>
            <p className="text-sm text-gray-500">ลองเปลี่ยนตัวกรองหรือเพิ่มทีมใหม่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/settings/teams/${team.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">รหัส: {team.code}</p>
                  </div>
                  {team.isActive ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                      ใช้งาน
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      ปิดใช้งาน
                    </span>
                  )}
                </div>

                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {team.leader && (
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-foreground font-medium">{team.leader.fullName}</span>
                      <span className="ml-1 text-muted-foreground">({team.leader.role})</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-foreground">{team._count?.members || 0} คน</span>
                  </div>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/settings/teams/${team.id}/edit`);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
                  >
                    แก้ไข
                  </button>
                  {team.isActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeactivateTeam(team.id);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
                    >
                      ปิดใช้งาน
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateTeam(team.id);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/90 transition-colors"
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
