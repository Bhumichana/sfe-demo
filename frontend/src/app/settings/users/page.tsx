'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { usersApi } from '@/services/api';

interface User {
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
  };
  manager?: {
    id: string;
    fullName: string;
    role: string;
  };
  company: {
    id: string;
    name: string;
  };
  _count?: {
    subordinates: number;
    preCallPlans: number;
    callReports: number;
  };
  createdAt: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        companyId: currentUser?.companyId,
      };

      if (selectedRole !== 'ALL') {
        params.role = selectedRole;
      }

      if (selectedStatus === 'ACTIVE') {
        params.isActive = true;
      } else if (selectedStatus === 'INACTIVE') {
        params.isActive = false;
      }

      const data = await usersApi.findAll(params);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await usersApi.activate(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('ไม่สามารถเปิดใช้งาน user ได้');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (confirm('คุณต้องการปิดใช้งาน user นี้ใช่หรือไม่?')) {
      try {
        await usersApi.remove(userId);
        fetchUsers();
      } catch (error) {
        console.error('Error deactivating user:', error);
        alert('ไม่สามารถปิดใช้งาน user ได้');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  const roleColors: Record<string, string> = {
    SR: 'bg-blue-100 text-blue-700',
    SUP: 'bg-purple-100 text-purple-700',
    SM: 'bg-green-100 text-green-700',
    PM: 'bg-orange-100 text-orange-700',
    MM: 'bg-red-100 text-red-700',
  };

  const roleLabels: Record<string, string> = {
    SR: 'Sales Rep',
    SUP: 'Supervisor',
    SM: 'Sales Manager',
    PM: 'Product Manager',
    MM: 'Marketing Manager',
  };

  return (
    <MainLayout title="จัดการผู้ใช้งาน" subtitle="User Management" showBackButton={true}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/settings/users/create')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มผู้ใช้งาน
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            ทั้งหมด: <span className="font-semibold text-foreground">{filteredUsers.length}</span> คน
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ชื่อ, อีเมล, username..."
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

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">ตำแหน่ง</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="SR">Sales Rep (SR)</option>
                <option value="SUP">Supervisor (SUP)</option>
                <option value="SM">Sales Manager (SM)</option>
                <option value="PM">Product Manager (PM)</option>
                <option value="MM">Marketing Manager (MM)</option>
              </select>
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

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">ไม่พบผู้ใช้งาน</h3>
            <p className="text-sm text-gray-500">ลองเปลี่ยนตัวกรองหรือเพิ่มผู้ใช้งานใหม่</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ใช้งาน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ตำแหน่ง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เขต
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้จัดการ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.territory ? (
                          <div className="text-sm">
                            <div className="font-medium text-foreground">{user.territory.nameTh}</div>
                            <div className="text-xs text-muted-foreground">{user.territory.code}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.manager ? (
                          <div className="text-sm text-foreground">{user.manager.fullName}</div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                            ใช้งานอยู่
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            ปิดใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/settings/users/${user.id}`)}
                            className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => router.push(`/settings/users/${user.id}/edit`)}
                            className="p-2 text-warning hover:bg-warning/10 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          {user.isActive ? (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="ปิดใช้งาน"
                              disabled={user.id === currentUser?.id}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                              title="เปิดใช้งาน"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
