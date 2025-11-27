'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { teamsApi } from '@/services/api';

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuthStore();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const teamId = params?.id as string;

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await teamsApi.findOne(teamId);
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
      alert('ไม่สามารถโหลดข้อมูลทีมได้');
      router.push('/settings/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      await teamsApi.activate(teamId);
      fetchTeam();
    } catch (error) {
      console.error('Error activating team:', error);
      alert('ไม่สามารถเปิดใช้งานทีมได้');
    }
  };

  const handleDeactivate = async () => {
    if (confirm('คุณต้องการปิดใช้งานทีมนี้ใช่หรือไม่?')) {
      try {
        await teamsApi.remove(teamId);
        fetchTeam();
      } catch (error: any) {
        console.error('Error deactivating team:', error);
        alert(error.response?.data?.message || 'ไม่สามารถปิดใช้งานทีมได้');
      }
    }
  };

  if (loading || !team) {
    return (
      <MainLayout title="รายละเอียดทีม" subtitle="Team Detail" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="รายละเอียดทีม" subtitle="Team Detail" showBackButton={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{team.name}</h2>
            <p className="text-sm text-muted-foreground">รหัส: {team.code}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/settings/teams')}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors"
            >
              กลับ
            </button>
            <button
              onClick={() => router.push(`/settings/teams/${teamId}/edit`)}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
            >
              แก้ไข
            </button>
            {team.isActive ? (
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
              <label className="block text-sm font-medium text-muted-foreground mb-1">รหัสทีม</label>
              <p className="text-foreground">{team.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ชื่อทีม</label>
              <p className="text-foreground">{team.name}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">คำอธิบาย</label>
              <p className="text-foreground">{team.description || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">หัวหน้าทีม</label>
              <p className="text-foreground">
                {team.leader ? `${team.leader.fullName} (${team.leader.role})` : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">สถานะ</label>
              {team.isActive ? (
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

        {/* Members */}
        {team.members && team.members.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              สมาชิกในทีม ({team.members.length} คน)
            </h3>
            <div className="space-y-3">
              {team.members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/settings/users/${member.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.fullName}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {member.role}
                    </span>
                    {member.isActive ? (
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
