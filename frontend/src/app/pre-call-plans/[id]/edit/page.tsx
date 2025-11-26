'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { preCallPlansApi } from '@/services/api';
import { UpdatePreCallPlanDto, PreCallPlan } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';
import axios from 'axios';

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

interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'A' | 'B' | 'C';
}

interface Contact {
  id: string;
  name: string;
  position: string;
}

export default function EditPreCallPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.id as string;
  const { user } = useAuthStore();

  const [plan, setPlan] = useState<PreCallPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<{
    customerId: string;
    contactId: string;
    planDate: string;
    planTime: string;
    objectives: string;
    plannedActivities: string[];
  }>({
    customerId: '',
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

  // Fetch plan data
  useEffect(() => {
    if (!planId) return;

    const fetchPlan = async () => {
      try {
        setLoading(true);
        const data = await preCallPlansApi.findOne(planId);
        setPlan(data);

        // Check if plan can be edited
        if (data.status !== 'DRAFT') {
          alert('ไม่สามารถแก้ไขแผนที่ไม่ใช่ฉบับร่างได้');
          router.push(`/pre-call-plans/${planId}`);
          return;
        }

        // Extract date and time from planDate
        const planDateTime = new Date(data.planDate);
        const dateStr = planDateTime.toISOString().split('T')[0];
        const timeStr = planDateTime.toTimeString().slice(0, 5);

        setFormData({
          customerId: data.customerId || '',
          contactId: data.contactId || '',
          planDate: dateStr,
          planTime: timeStr,
          objectives: data.objectives || '',
          plannedActivities: data.plannedActivities || [],
        });

        setSelectedActivities(new Set(data.plannedActivities || []));
      } catch (error) {
        console.error('Failed to load plan:', error);
        alert('ไม่สามารถโหลดข้อมูลได้');
        router.push('/pre-call-plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await axios.get('http://localhost:3000/api/customers');
        setCustomers(response.data);
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
        const response = await axios.get(
          `http://localhost:3000/api/customers/${formData.customerId}/contacts`
        );
        setContacts(response.data);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [formData.customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !plan) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!formData.customerId || !formData.contactId || !formData.planDate || !formData.planTime) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    try {
      setSaving(true);

      // Combine date and time into ISO datetime string
      const planDateTime = `${formData.planDate}T${formData.planTime}:00`;

      const updateDto: UpdatePreCallPlanDto = {
        customerId: formData.customerId,
        contactId: formData.contactId,
        planDate: planDateTime,
        objectives: formData.objectives || undefined,
        plannedActivities: Array.from(selectedActivities),
      };

      await preCallPlansApi.update(plan.id, user.id, updateDto);
      alert('แก้ไขแผนสำเร็จ!');
      router.push(`/pre-call-plans/${plan.id}`);
    } catch (error: any) {
      console.error('Failed to update plan:', error);
      alert(error.response?.data?.message || 'ไม่สามารถแก้ไขแผนได้ กรุณาลองใหม่อีกครั้ง');
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

  if (loading) {
    return (
      <MainLayout title="แก้ไข Pre-Call Plan" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout title="ไม่พบข้อมูล" showBackButton={true}>
        <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            ไม่พบข้อมูลแผนการเยี่ยมเยียน
          </h3>
          <button
            onClick={() => router.push('/pre-call-plans')}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="แก้ไข Pre-Call Plan"
      subtitle="แก้ไขแผนการเยี่ยมเยียนลูกค้า"
      showBackButton={true}
    >
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
          <label className="block text-sm font-bold text-gray-900 mb-4">
            กิจกรรมที่วางแผนจะทำ
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_ACTIVITIES.map((activity) => (
              <label
                key={activity}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedActivities.has(activity)}
                  onChange={() => toggleActivity(activity)}
                  className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-gray-900 font-semibold">{activity}</span>
              </label>
            ))}
          </div>
          {selectedActivities.size > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              เลือกแล้ว {selectedActivities.size} กิจกรรม
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push(`/pre-call-plans/${plan.id}`)}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            disabled={saving}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>
        </div>
      </form>
    </MainLayout>
  );
}
