'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { teamsApi, usersApi } from '@/services/api';

export default function CreateTeamPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [potentialLeaders, setPotentialLeaders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    leaderId: '',
  });

  useEffect(() => {
    if (currentUser) {
      fetchPotentialLeaders();
    }
  }, [currentUser]);

  const fetchPotentialLeaders = async () => {
    try {
      const users = await usersApi.findAll({
        companyId: currentUser?.companyId,
        isActive: true,
      });
      // Filter for managers and supervisors
      const leaders = users.filter((u: any) =>
        ['SM', 'SUP', 'PM', 'MM', 'SD'].includes(u.role)
      );
      setPotentialLeaders(leaders);
    } catch (error) {
      console.error('Error fetching leaders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      alert('กรุณากรอกรหัสทีมและชื่อทีม');
      return;
    }

    if (!currentUser || !currentUser.companyId) {
      alert('ไม่สามารถระบุ Company ID ได้');
      return;
    }

    try {
      setLoading(true);
      await teamsApi.create({
        ...formData,
        companyId: currentUser.companyId,
        leaderId: formData.leaderId || undefined,
      });

      alert('สร้างทีมสำเร็จ');
      router.push('/settings/teams');
    } catch (error: any) {
      console.error('Error creating team:', error);
      alert(error.response?.data?.message || 'ไม่สามารถสร้างทีมได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="เพิ่มทีมใหม่" subtitle="Create New Team" showBackButton={true}>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              รหัสทีม <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="เช่น TEAM-BKK-01"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อทีม <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น Bangkok North Sales Team"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              คำอธิบาย
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="คำอธิบายเกี่ยวกับทีม..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Leader */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              หัวหน้าทีม
            </label>
            <select
              value={formData.leaderId}
              onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- เลือกหัวหน้าทีม --</option>
              {potentialLeaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.fullName} ({leader.role})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/settings/teams')}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
