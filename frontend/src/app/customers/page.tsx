'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { customersApi } from '@/services/api';
import { CustomerWithStatistics, CustomerType } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

const TYPE_COLORS: Record<CustomerType, string> = {
  A: 'bg-purple-100 text-purple-700 border-purple-300',
  B: 'bg-blue-100 text-blue-700 border-blue-300',
  C: 'bg-gray-100 text-gray-700 border-gray-300',
};

const TYPE_LABELS: Record<CustomerType, string> = {
  A: 'VIP',
  B: 'Important',
  C: 'Standard',
};

export default function CustomersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [customers, setCustomers] = useState<CustomerWithStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CustomerType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadCustomers();
  }, [isAuthenticated, filter, search]);

  const loadCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await customersApi.getMyCustomers({
        type: filter === 'ALL' ? undefined : filter,
        search: search || undefined,
      });
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredCount = {
    ALL: customers.length,
    A: customers.filter((c) => c.type === 'A').length,
    B: customers.filter((c) => c.type === 'B').length,
    C: customers.filter((c) => c.type === 'C').length,
  };

  return (
    <MainLayout title="ลูกค้า" subtitle="Customers" showBackButton={true}>
      <div className="space-y-6">
        {/* Create Customer Button */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/customers/create')}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มลูกค้าใหม่
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาลูกค้า (ชื่อ, รหัส, ที่อยู่)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-11 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <svg
            className="w-5 h-5 text-muted-foreground absolute left-3.5 top-3.5"
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

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['ALL', 'A', 'B', 'C'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filter === type
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-foreground hover:bg-gray-50'
              }`}
            >
              {type === 'ALL' ? 'ทั้งหมด' : TYPE_LABELS[type]} ({filteredCount[type]})
            </button>
          ))}
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-border">
            <svg
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-foreground mb-2">ไม่พบข้อมูลลูกค้า</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'ไม่พบลูกค้าที่ตรงกับคำค้นหา' : 'คุณยังไม่มีลูกค้า'}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/customers/create')}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg inline-flex items-center gap-2 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มลูกค้าใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => router.push(`/customers/${customer.id}`)}
                className="bg-white rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-lg truncate">
                        {customer.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          TYPE_COLORS[customer.type]
                        }`}
                      >
                        {TYPE_LABELS[customer.type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">รหัส: {customer.code}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Customer Info */}
                <div className="space-y-1.5 mb-3">
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-muted-foreground line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-muted-foreground flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-muted-foreground">{customer.phone}</span>
                    </div>
                  )}
                  {customer.territory && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-muted-foreground flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <span className="text-muted-foreground">{customer.territory.nameTh}</span>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="font-medium text-foreground">{customer.statistics.totalPlans}</span>
                    <span className="text-muted-foreground">แผน</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-foreground">{customer.statistics.totalReports}</span>
                    <span className="text-muted-foreground">เยี่ยม</span>
                  </div>
                  {customer.statistics.lastVisit && (
                    <div className="flex items-center gap-1.5 text-sm ml-auto">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-muted-foreground">
                        {format(new Date(customer.statistics.lastVisit), 'd MMM yy', { locale: th })}
                      </span>
                    </div>
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
