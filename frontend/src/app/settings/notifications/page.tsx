'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { api } from '@/services/api';

interface NotificationPreferences {
  planApproved: boolean;
  planRejected: boolean;
  planPending: boolean;
  reminder: boolean;
  coaching: boolean;
  system: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface PreferenceSetting {
  id: keyof NotificationPreferences;
  title: string;
  description: string;
  category: string;
}

export default function NotificationSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    planApproved: true,
    planRejected: true,
    planPending: true,
    reminder: true,
    coaching: true,
    system: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const settingToggles: PreferenceSetting[] = [
    // Notification Types
    {
      id: 'planApproved',
      title: 'แผนได้รับการอนุมัติ',
      description: 'แจ้งเตือนเมื่อแผนการเยี่ยมลูกค้าได้รับการอนุมัติ',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'planRejected',
      title: 'แผนถูกปฏิเสธ',
      description: 'แจ้งเตือนเมื่อแผนการเยี่ยมลูกค้าถูกปฏิเสธ',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'planPending',
      title: 'แผนรอการอนุมัติ',
      description: 'แจ้งเตือนเมื่อมีแผนรอการอนุมัติ (สำหรับผู้จัดการ)',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'reminder',
      title: 'การเตือนความจำ',
      description: 'แจ้งเตือนสำหรับนัดหมายและกิจกรรมที่กำลังจะถึง',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'coaching',
      title: 'คำแนะนำจากผู้จัดการ',
      description: 'แจ้งเตือนเมื่อได้รับคำแนะนำหรือ coaching',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'system',
      title: 'การแจ้งเตือนระบบ',
      description: 'ข่าวสารและการอัพเดทจากระบบ',
      category: 'ประเภทการแจ้งเตือน',
    },
    // Delivery Methods
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      description: 'แจ้งเตือนผ่านแอพพลิเคชัน',
      category: 'วิธีการแจ้งเตือน',
    },
    {
      id: 'emailNotifications',
      title: 'อีเมล',
      description: 'ส่งการแจ้งเตือนผ่านอีเมล',
      category: 'วิธีการแจ้งเตือน',
    },
    // Interaction
    {
      id: 'soundEnabled',
      title: 'เสียง',
      description: 'เปิดเสียงเมื่อมีการแจ้งเตือน',
      category: 'การโต้ตอบ',
    },
    {
      id: 'vibrationEnabled',
      title: 'การสั่น',
      description: 'เปิดการสั่นเมื่อมีการแจ้งเตือน',
      category: 'การโต้ตอบ',
    },
  ];

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/notifications/preferences/${user?.id}`);
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      alert('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];

    // Update local state immediately for better UX
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      setSaving(true);
      await api.put(`/notifications/preferences/${user?.id}`, {
        [key]: newValue,
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      alert('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('คุณต้องการรีเซ็ตการตั้งค่าการแจ้งเตือนเป็นค่าเริ่มต้นหรือไม่?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(
        `/notifications/preferences/${user?.id}/reset`
      );
      setPreferences(response.data);
      alert('รีเซ็ตการตั้งค่าเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error resetting preferences:', error);
      alert('ไม่สามารถรีเซ็ตการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = (categoryName: string) => {
    const categoryItems = settingToggles.filter(
      item => item.category === categoryName
    );

    return (
      <div key={categoryName} className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 px-4">
          {categoryName}
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-border divide-y divide-border">
          {categoryItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 pr-4">
                <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[item.id]}
                  onChange={() => togglePreference(item.id)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const categories = [
    'ประเภทการแจ้งเตือน',
    'วิธีการแจ้งเตือน',
    'การโต้ตอบ',
  ];

  if (loading) {
    return (
      <MainLayout title="การแจ้งเตือน" subtitle="Notification Settings" showBackButton={true}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="การแจ้งเตือน" subtitle="ตั้งค่าการแจ้งเตือน" showBackButton={true}>
      <div className="max-w-3xl mx-auto">
        {/* Description Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">จัดการการแจ้งเตือนของคุณ</h3>
              <p className="text-sm text-blue-800">
                เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ และวิธีการที่คุณต้องการให้แจ้งเตือน
                การตั้งค่าจะถูกบันทึกอัตโนมัติเมื่อคุณเปลี่ยนแปลง
              </p>
            </div>
          </div>
        </div>

        {/* Settings Categories */}
        {categories.map(category => renderCategory(category))}

        {/* Reset Button */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-border p-4">
          <div>
            <h4 className="font-medium text-foreground mb-1">รีเซ็ตเป็นค่าเริ่มต้น</h4>
            <p className="text-sm text-muted-foreground">
              กู้คืนการตั้งค่าการแจ้งเตือนทั้งหมดเป็นค่าเริ่มต้น
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            disabled={saving}
            className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            รีเซ็ต
          </button>
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-border p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-foreground">กำลังบันทึก...</span>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
