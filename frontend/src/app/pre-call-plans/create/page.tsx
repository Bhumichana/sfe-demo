'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi, customersApi, contactsApi } from '@/services/api';
import { CreatePreCallPlanDto, Customer, Contact } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';
import QuickCreateCustomerModal from '@/components/modals/QuickCreateCustomerModal';

const MOCK_ACTIVITIES = [
  'Detail product',
  'วาง POP/POSM',
  'เสนอสินค้าเข้า',
  'Present product',
  'Sampling',
  'Handle customer problems',
  'รับ sales order',
  'เช็ค stock',
  'ติดตาม product spec',
  'วางบิล/ตามบิล/เก็บเงิน',
  'Business meal',
  'ออก booth',
  'ประมาณงบการ engage',
];

function CreatePreCallPlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  // Get customerId from URL query parameter
  const preselectedCustomerId = searchParams.get('customerId');

  const [formData, setFormData] = useState<{
    customerId: string;
    contactId: string;
    planDate: string;
    planTime: string;
    objectives: string;
    plannedActivities: string[];
  }>({
    customerId: preselectedCustomerId || '',
    contactId: '',
    planDate: '',
    planTime: '',
    objectives: '',
    plannedActivities: [],
  });

  const [saving, setSaving] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  // API data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Modal state
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const data = await customersApi.findAll();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        alert('ไม่สามารถโหลดข้อมูลลูกค้าได้');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch contacts when customer is selected
  useEffect(() => {
    const fetchContacts = async () => {
      if (!formData.customerId) {
        setContacts([]);
        return;
      }

      try {
        setLoadingContacts(true);
        const data = await contactsApi.findByCustomer(formData.customerId);
        setContacts(data);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [formData.customerId]);

  // Handle customer creation success
  const handleCustomerCreated = async (customer: any) => {
    // Add new customer to list
    setCustomers([...customers, customer]);

    // Auto-select the new customer
    setFormData({
      ...formData,
      customerId: customer.id,
      contactId: customer.contacts?.[0]?.id || '', // Auto-select first contact if exists
    });

    // Update contacts list if contact was created
    if (customer.contacts && customer.contacts.length > 0) {
      setContacts(customer.contacts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!formData.customerId || !formData.contactId || !formData.planDate || !formData.planTime) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    try {
      setSaving(true);

      // Combine date and time into ISO datetime string (without Z to preserve local timezone)
      const planDateTime = `${formData.planDate}T${formData.planTime}:00`;

      console.log('📅 Creating plan with datetime:', {
        planDate: formData.planDate,
        planTime: formData.planTime,
        combined: planDateTime,
      });

      const createDto: CreatePreCallPlanDto = {
        srId: user.id,
        customerId: formData.customerId,
        contactId: formData.contactId,
        planDate: planDateTime,
        objectives: formData.objectives || undefined,
        plannedActivities: Array.from(selectedActivities),
      };

      console.log('📤 Sending DTO:', createDto);

      // Step 1: Create the plan
      const result = await preCallPlansApi.create(createDto);
      console.log('✅ Created plan result:', result);

      // Step 2: Submit the plan for approval
      console.log('📨 Submitting plan for approval...');
      await preCallPlansApi.submit(result.id, user.id);
      console.log('✅ Plan submitted for approval');

      alert('สร้างและส่งแผนขออนุมัติสำเร็จ!');
      router.push('/pre-call-plans');
    } catch (error: any) {
      console.error('Failed to create/submit plan:', error);
      alert(error.response?.data?.message || 'ไม่สามารถสร้างแผนได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivity = (activity: string) => {
    const newActivities = new Set(selectedActivities);
    if (newActivities.has(activity)) {
      newActivities.delete(activity);
    } else {
      newActivities.add(activity);
    }
    setSelectedActivities(newActivities);
  };

  // Get icon for activity type
  const getActivityIcon = (activityName: string): string => {
    const name = activityName.toLowerCase();

    // Detail Product
    if (name.includes('detail') && name.includes('product')) {
      return '📦';
    }
    // POP/POSM
    if (name.includes('pop') || name.includes('posm') || name.includes('วาง')) {
      return '🎯';
    }
    // Propose/List Product
    if (name.includes('propose') || name.includes('list') || name.includes('เสนอ') || name.includes('listing')) {
      return '📋';
    }
    // Present Product
    if (name.includes('present')) {
      return '🎤';
    }
    // Sampling
    if (name.includes('sampling') || name.includes('แจก')) {
      return '🎁';
    }
    // Handle Problems
    if (name.includes('problem') || name.includes('แก้ไข') || name.includes('ปัญหา')) {
      return '🔧';
    }
    // Take/Receive Order
    if (name.includes('order') || name.includes('รับ') || name.includes('ออเดอร์')) {
      return '📝';
    }
    // Check Stock
    if (name.includes('stock') || name.includes('เช็ค') || name.includes('สต๊อก')) {
      return '📊';
    }
    // Training
    if (name.includes('train') || name.includes('อบรม')) {
      return '🎓';
    }
    // Promotion
    if (name.includes('promotion') || name.includes('โปรโมชั่น')) {
      return '🎉';
    }
    // Payment/Collection/Billing
    if (name.includes('payment') || name.includes('collection') || name.includes('billing') || name.includes('เก็บเงิน') || name.includes('วางบิล') || name.includes('ตามบิล')) {
      return '💰';
    }
    // Delivery
    if (name.includes('delivery') || name.includes('ส่งของ')) {
      return '🚚';
    }
    // Meeting/Business meal
    if (name.includes('meeting') || name.includes('ประชุม') || name.includes('business') || name.includes('meal')) {
      return '🍽️';
    }
    // Survey
    if (name.includes('survey') || name.includes('สำรวจ')) {
      return '🔍';
    }
    // Follow up/Spec/ติดตาม
    if (name.includes('follow') || name.includes('spec') || name.includes('ติดตาม')) {
      return '📞';
    }
    // Booth/Event/ออกบูธ
    if (name.includes('booth') || name.includes('event') || name.includes('ออก') || name.includes('บูธ')) {
      return '🏪';
    }
    // Budget/Engage/ประมาณการ
    if (name.includes('budget') || name.includes('engage') || name.includes('ประมาณ')) {
      return '💼';
    }

    // Default icon
    return '📌';
  };

  return (
    <MainLayout title="สร้าง Pre-Call Plan" subtitle="วางแผนการเยี่ยมเยียนลูกค้าล่วงหน้า" showBackButton={true}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              ลูกค้า <span className="text-error">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customerId: e.target.value,
                  contactId: '', // Reset contact when customer changes
                })
              }
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              required
              disabled={loadingCustomers}
            >
              <option value="">
                {loadingCustomers ? 'กำลังโหลด...' : 'เลือกลูกค้า...'}
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  [{customer.type}] {customer.code} - {customer.name}
                </option>
              ))}
            </select>

            {/* Quick Create Button */}
            <button
              type="button"
              onClick={() => setShowCreateCustomerModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ไม่มีลูกค้าในรายการ? สร้างลูกค้าใหม่
            </button>
          </div>

          {/* Contact Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              ผู้ติดต่อ <span className="text-error">*</span>
            </label>
            <select
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={!formData.customerId || loadingContacts}
              required
            >
              <option value="">
                {loadingContacts ? 'กำลังโหลด...' : 'เลือกผู้ติดต่อ...'}
              </option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.position}
                </option>
              ))}
            </select>
            {!formData.customerId && (
              <p className="text-sm text-gray-900 font-semibold mt-2">
                กรุณาเลือกลูกค้าก่อน
              </p>
            )}
            {formData.customerId && contacts.length === 0 && !loadingContacts && (
              <p className="text-sm text-warning font-semibold mt-2">
                ไม่พบผู้ติดต่อสำหรับลูกค้านี้
              </p>
            )}
          </div>

          {/* Plan Date and Time */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              วันที่วางแผนเยี่ยมเยียน <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={formData.planDate}
              onChange={(e) => setFormData({ ...formData, planDate: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary mb-4"
              required
            />

            <label className="block text-sm font-bold text-gray-900 mb-2">
              เวลา <span className="text-error">*</span>
            </label>
            <input
              type="time"
              value={formData.planTime}
              onChange={(e) => setFormData({ ...formData, planTime: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          {/* Objectives */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              วัตถุประสงค์
            </label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              rows={4}
              placeholder="ระบุวัตถุประสงค์ของการเยี่ยมเยียน..."
            />
          </div>

          {/* Planned Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              กิจกรรมที่วางแผนจะทำ
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {MOCK_ACTIVITIES.map((activity) => {
                const isSelected = selectedActivities.has(activity);
                const icon = getActivityIcon(activity);

                return (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => toggleActivity(activity)}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-primary bg-primary text-white shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className={`text-4xl mb-2 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                      {icon}
                    </div>

                    {/* Activity Name */}
                    <div className={`text-center text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {activity}
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedActivities.size > 0 && (
              <p className="text-sm text-primary mt-4 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เลือกแล้ว {selectedActivities.size} กิจกรรม
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={saving}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'กำลังส่ง...' : 'บันทึกและส่งขออนุมัติ'}
            </button>
          </div>
        </form>

        {/* Quick Create Customer Modal */}
        <QuickCreateCustomerModal
          isOpen={showCreateCustomerModal}
          onClose={() => setShowCreateCustomerModal(false)}
          onSuccess={handleCustomerCreated}
        />
    </MainLayout>
  );
}

export default function CreatePreCallPlanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePreCallPlanPageContent />
    </Suspense>
  );
}
