'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const settingsMenuItems = [
    {
      id: 'users',
      title: 'จัดการผู้ใช้งาน',
      description: 'จัดการผู้ใช้งาน, บทบาท และสิทธิ์การเข้าถึง',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/settings/users',
      color: 'primary',
    },
    {
      id: 'activities',
      title: 'จัดการ Activity Types',
      description: 'จัดการรายการกิจกรรมที่ใช้ในการเยี่ยมลูกค้า',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/settings/activities',
      color: 'success',
    },
    {
      id: 'profile',
      title: 'โปรไฟล์',
      description: 'จัดการข้อมูลส่วนตัว',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/settings/profile',
      color: 'info',
    },
    {
      id: 'notifications',
      title: 'การแจ้งเตือน',
      description: 'ตั้งค่าการแจ้งเตือน',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      href: '/settings/notifications',
      color: 'warning',
    },
    {
      id: 'company',
      title: 'ข้อมูลบริษัท',
      description: 'ดูข้อมูลบริษัทและการใช้งาน',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: '/settings/company',
      color: 'success',
    },
  ];

  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <MainLayout title="ตั้งค่า" subtitle="Settings" showBackButton={true}>
      <div className="space-y-6">
        {/* User Info Card */}
        {user && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-gold rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{user.fullName}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {user.role}
                  </span>
                  {user.territory && (
                    <span className="ml-2">
                      เขต: {user.territory.nameTh}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Menu */}
        <div className="space-y-3">
          {settingsMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="w-full bg-white rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-all text-left flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[item.color]}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">เกี่ยวกับแอป</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">เวอร์ชัน</span>
              <span className="text-foreground font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="text-foreground font-medium">2025.01.18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="text-foreground font-medium">Web (Next.js)</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
