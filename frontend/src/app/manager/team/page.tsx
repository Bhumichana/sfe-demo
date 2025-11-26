'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import SRPerformanceChart from '@/components/charts/SRPerformanceChart';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  territory: {
    code: string;
    nameTh: string;
  } | null;
  lastLogin: string | null;
  stats: {
    totalCalls: number;
    monthCalls: number;
    pendingPlans: number;
    draftReports: number;
  };
}

interface TeamResponse {
  total: number;
  members: TeamMember[];
}

export default function TeamMembersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'SUP' && user?.role !== 'SM' && user?.role !== 'PM' && user?.role !== 'MM') {
      router.push('/');
      return;
    }

    fetchTeamMembers();
  }, [isAuthenticated, user, router]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manager/team/${user?.id}`);

      if (!response.ok) throw new Error('Failed to fetch team');

      const data = await response.json();
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = team?.members.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // เตรียมข้อมูลสำหรับกราฟ Donut Chart
  const chartData = useMemo(() => {
    if (!team?.members) return [];

    return team.members
      .filter(member => member.stats.monthCalls > 0) // แสดงเฉพาะคนที่มี calls ในเดือนนี้
      .map(member => ({
        name: member.fullName.split(' ')[0], // ใช้ชื่อแรกเพื่อไม่ให้ยาวเกินไป
        fullName: member.fullName,
        value: member.stats.monthCalls,
      }))
      .sort((a, b) => b.value - a.value); // เรียงจากมากไปน้อย
  }, [team]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout
      title="Team Members"
      subtitle={`จัดการทีม ${user?.fullName || ''}`}
      showBackButton={true}
    >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Search and Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-border mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Total: {team?.total || 0} Members
                </h2>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* SR Performance Chart */}
            {chartData.length > 0 && (
              <div className="mb-6">
                <SRPerformanceChart data={chartData} title="SR Performance - This Month" />
              </div>
            )}

            {/* Team Members List */}
            <div className="space-y-4">
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {member.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {member.fullName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          {member.phone && (
                            <p className="text-sm text-muted-foreground">{member.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {member.territory && (
                          <span className="text-xs text-muted-foreground">
                            {member.territory.code} - {member.territory.nameTh}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {member.stats.totalCalls}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {member.stats.monthCalls}
                        </div>
                        <div className="text-xs text-muted-foreground">This Month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                          {member.stats.pendingPlans}
                        </div>
                        <div className="text-xs text-muted-foreground">Pending Plans</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {member.stats.draftReports}
                        </div>
                        <div className="text-xs text-muted-foreground">Draft Reports</div>
                      </div>
                    </div>

                    {member.lastLogin && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Last login: {new Date(member.lastLogin).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-border">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-foreground">No team members found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'No team members assigned to you yet'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
    </MainLayout>
  );
}
