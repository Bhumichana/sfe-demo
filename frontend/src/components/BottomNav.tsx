'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  // Check if user is a manager
  const isManager = user?.role === 'SM' || user?.role === 'MM';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      showFor: 'all', // Show for all users
    },
    {
      id: 'approvals',
      label: 'Approval',
      path: '/approvals',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      showFor: 'manager', // Show only for managers
    },
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/calendar',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      showFor: 'all',
    },
    {
      id: 'reports',
      label: 'Analytics',
      path: '/reports',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      showFor: 'all',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      showFor: 'all',
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.showFor === 'all') return true;
    if (item.showFor === 'manager') return isManager;
    return false;
  });

  // Don't show bottom nav on login page
  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-50">
      <div className="max-w-7xl mx-auto">
        <div className={`grid ${filteredNavItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} h-16`}>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon(isActive)}
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
