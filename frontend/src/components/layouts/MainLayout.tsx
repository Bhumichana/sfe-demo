'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import NotificationCenter from '@/components/NotificationCenter';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export default function MainLayout({
  children,
  title = 'SFE Mobile',
  subtitle = 'Sales Force Effectiveness',
  showBackButton = false,
}: MainLayoutProps) {
  const router = useRouter();
  const { user, logout, initAuth } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    console.log('🏠 MainLayout mounted, calling initAuth');
    initAuth();
  }, [initAuth]);

  // Debug log on every render
  console.log('🏠 MainLayout render, user:', user);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      console.log('🔔 No user, skipping fetch unread count');
      return;
    }
    try {
      console.log('🔔 Fetching unread count for user:', user.id);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${apiUrl}/notifications/user/${user.id}/unread-count`);
      console.log('🔔 Unread count response:', response.data);
      // Backend returns number directly for now
      const count = typeof response.data === 'number' ? response.data : response.data.count;
      console.log('🔔 Setting unread count to:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('🔔 Error fetching unread count:', error);
    }
  }, [user]);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    console.log('🔔 useEffect triggered, user:', user);
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // Refresh unread count when closing notification center
    fetchUnreadCount();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              {!showBackButton && (
                <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
                title="การแจ้งเตือน"
              >
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => router.push('/settings')}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                title="ตั้งค่า"
              >
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-error border border-error rounded-lg hover:bg-error/10 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Center */}
      {user && (
        <NotificationCenter
          userId={user.id}
          isOpen={showNotifications}
          onClose={handleCloseNotifications}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-auto mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            SFE Mobile v1.0.0 • 2025 • Built with Next.js + NestJS
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
