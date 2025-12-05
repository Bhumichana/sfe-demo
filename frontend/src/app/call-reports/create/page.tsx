'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { callReportsApi, customersApi, contactsApi, activityTypesApi, preCallPlansApi } from '@/services/api';
import { Customer, Contact, ActivityTypeData, ActivityType, CreateCallReportDto, PreCallPlan } from '@/types';
import { format } from 'date-fns';
import MainLayout from '@/components/layouts/MainLayout';
import { calculateDistance, formatDistance, getCheckInRadius, isWithinRadius } from '@/utils/geoUtils';

type PhotoCategory = 'product' | 'pop_posm' | 'customer' | 'activity' | 'other';

interface CapturedPhoto {
  dataUrl: string;
  blob: Blob;
  timestamp: Date;
  category: PhotoCategory;
}

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
}

const PHOTO_CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: 'product', label: '📦 สินค้า' },
  { value: 'pop_posm', label: '🎨 POP/POSM' },
  { value: 'customer', label: '🏢 ลูกค้า' },
  { value: 'activity', label: '🎯 กิจกรรม' },
  { value: 'other', label: '📷 อื่นๆ' },
];

function CreateCallReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form state
  const [preCallPlans, setPreCallPlans] = useState<PreCallPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Camera & Photo state
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<PhotoCategory>('product');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Check-in state
  const [checkInLocation, setCheckInLocation] = useState<Location | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    customerId: '',
    contactId: '',
    callDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    callActivityType: 'FACE_TO_FACE' as ActivityType,
    activitiesDone: [] as string[],
    customerResponse: '',
    customerRequest: '',
    customerObjections: '',
    customerNeeds: '',
    customerComplaints: '',
    nextAction: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [customersData, activityTypesData, plansData, allReports] = await Promise.all([
        customersApi.findAll(),
        activityTypesApi.findAll(),
        preCallPlansApi.findByUser(user.id, 'APPROVED'), // Only approved plans
        callReportsApi.findByUser(user.id), // Get all reports to check which plans have reports
      ]);

      setCustomers(customersData);
      setActivityTypes(activityTypesData.filter(at => at.isActive));

      // Mark plans that already have reports
      const plansWithReports = new Set(
        allReports
          .filter((report: any) => report.preCallPlanId)
          .map((report: any) => report.preCallPlanId)
      );

      const plansWithStatus = plansData.map((plan: any) => ({
        ...plan,
        hasReport: plansWithReports.has(plan.id),
      }));

      setPreCallPlans(plansWithStatus);

      // Auto-fill from Pre-Call Plan if provided via query params
      const preCallPlanId = searchParams.get('preCallPlanId');
      if (preCallPlanId) {
        handlePreCallPlanSelect(preCallPlanId);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handlePreCallPlanSelect = async (planId: string) => {
    if (!planId) {
      // Reset form when no plan selected (unplanned call)
      setSelectedPlanId('');
      setFormData({
        customerId: '',
        contactId: '',
        callDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        callActivityType: 'FACE_TO_FACE',
        activitiesDone: [],
        customerResponse: '',
        customerRequest: '',
        customerObjections: '',
        customerNeeds: '',
        customerComplaints: '',
        nextAction: '',
      });
      setContacts([]);
      return;
    }

    const selectedPlan: any = preCallPlans.find(p => p.id === planId);
    if (!selectedPlan) return;

    // Prevent selecting a plan that already has a report
    if (selectedPlan.hasReport) {
      alert('Pre-Call Plan นี้มีการสร้างรายงานไปแล้ว\nกรุณาเลือก Plan อื่น');
      setSelectedPlanId('');
      return;
    }

    setSelectedPlanId(planId);

    // Auto-fill from Pre-Call Plan
    setFormData(prev => ({
      ...prev,
      customerId: selectedPlan.customerId,
      contactId: selectedPlan.contactId,
      callDate: format(new Date(selectedPlan.planDate), "yyyy-MM-dd'T'HH:mm"),
      activitiesDone: selectedPlan.plannedActivities || [],
    }));

    // Load contacts for selected customer
    await loadContacts(selectedPlan.customerId);
  };

  const loadContacts = async (customerId: string) => {
    try {
      const contactsData = await contactsApi.findByCustomer(customerId);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    setFormData(prev => ({
      ...prev,
      customerId,
      contactId: '', // Reset contact when customer changes
    }));

    if (customerId) {
      await loadContacts(customerId);
    } else {
      setContacts([]);
    }
  };

  const handleActivityToggle = (activityName: string) => {
    setFormData(prev => ({
      ...prev,
      activitiesDone: prev.activitiesDone.includes(activityName)
        ? prev.activitiesDone.filter(a => a !== activityName)
        : [...prev.activitiesDone, activityName],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      alert('กรุณาเลือกลูกค้า');
      return false;
    }
    if (!formData.contactId) {
      alert('กรุณาเลือกผู้ติดต่อ');
      return false;
    }
    if (!formData.callDate) {
      alert('กรุณาเลือกวันที่เยี่ยม');
      return false;
    }
    if (formData.activitiesDone.length === 0) {
      alert('กรุณาเลือกกิจกรรมที่ทำอย่างน้อย 1 รายการ');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!user) return;

    if (!formData.customerId || !formData.contactId) {
      alert('กรุณาเลือกลูกค้าและผู้ติดต่อก่อนบันทึก');
      return;
    }

    try {
      setSubmitting(true);

      const dto: CreateCallReportDto = {
        preCallPlanId: selectedPlanId || undefined,
        srId: user.id,
        customerId: formData.customerId,
        contactId: formData.contactId,
        callDate: formData.callDate,
        activityType: formData.callActivityType,
        activitiesDone: formData.activitiesDone,
        customerResponse: formData.customerResponse || undefined,
        customerRequest: formData.customerRequest || undefined,
        customerObjections: formData.customerObjections || undefined,
        customerNeeds: formData.customerNeeds || undefined,
        customerComplaints: formData.customerComplaints || undefined,
        nextAction: formData.nextAction || undefined,
        isPlanned: !!selectedPlanId,
      };

      await callReportsApi.create(dto);
      alert('บันทึกฉบับร่างสำเร็จ');
      router.push('/call-reports');
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      alert(error.response?.data?.message || 'ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Get customer location for distance validation
      const selectedCustomer = customers.find(c => c.id === formData.customerId);

      // Get current GPS location for check-in
      setGettingLocation(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      setGettingLocation(false);

      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;
      const checkInTime = new Date().toISOString();

      // Check distance if customer has GPS location
      if (selectedCustomer && selectedCustomer.lat && selectedCustomer.lng) {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          Number(selectedCustomer.lat),
          Number(selectedCustomer.lng)
        );
        const allowedRadius = getCheckInRadius(selectedCustomer.type);
        const withinRadius = isWithinRadius(
          currentLat,
          currentLng,
          Number(selectedCustomer.lat),
          Number(selectedCustomer.lng),
          allowedRadius
        );

        // Warning if outside radius
        if (!withinRadius) {
          const proceed = confirm(
            `⚠️ คำเตือน: คุณอยู่ห่างจากลูกค้า ${formatDistance(distance)}\n\n` +
            `ระยะที่อนุญาตสำหรับลูกค้า${selectedCustomer.type}: ${formatDistance(allowedRadius)}\n\n` +
            `คุณต้องการดำเนินการต่อหรือไม่?`
          );

          if (!proceed) {
            setSubmitting(false);
            return;
          }
        } else {
          // Show success message if within radius
          alert(`✅ ระบุตำแหน่งสำเร็จ\n\nคุณอยู่ห่างจากลูกค้า: ${formatDistance(distance)}`);
        }
      }

      const dto: CreateCallReportDto = {
        preCallPlanId: selectedPlanId || undefined,
        srId: user.id,
        customerId: formData.customerId,
        contactId: formData.contactId,
        callDate: formData.callDate,
        checkInTime: checkInTime,
        checkInLat: currentLat,
        checkInLng: currentLng,
        activityType: formData.callActivityType,
        activitiesDone: formData.activitiesDone,
        customerResponse: formData.customerResponse || undefined,
        customerRequest: formData.customerRequest || undefined,
        customerObjections: formData.customerObjections || undefined,
        customerNeeds: formData.customerNeeds || undefined,
        customerComplaints: formData.customerComplaints || undefined,
        nextAction: formData.nextAction || undefined,
        isPlanned: !!selectedPlanId,
      };

      const report = await callReportsApi.create(dto);

      // Submit the report
      await callReportsApi.submit(report.id, user.id);

      alert('ส่งรายงานสำเร็จ');
      router.push('/call-reports');
    } catch (error: any) {
      console.error('Failed to submit:', error);
      setGettingLocation(false);

      // Handle geolocation errors
      if (error.code) {
        if (error.code === 1) {
          alert('❌ ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง\n\nกรุณาเปิดการอนุญาตใน Location Services และลองอีกครั้ง');
        } else if (error.code === 2) {
          alert('❌ ไม่สามารถระบุตำแหน่งได้\n\nกรุณาตรวจสอบการเชื่อมต่อ GPS และลองอีกครั้ง');
        } else if (error.code === 3) {
          alert('❌ หมดเวลาในการค้นหาตำแหน่ง\n\nกรุณาลองอีกครั้ง');
        }
      } else {
        alert(error.response?.data?.message || 'ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setSubmitting(false);
      setGettingLocation(false);
    }
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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <MainLayout title="สร้างรายงาน" subtitle="Create Call Report" showBackButton={true}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="สร้างรายงาน" subtitle="Create Call Report" showBackButton={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Pre-Call Plan Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-lg font-bold text-foreground">เลือก Pre-Call Plan (ถ้ามี)</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pre-Call Plan ที่ได้รับอนุมัติ
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePreCallPlanSelect(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- ไม่มี Pre-Call Plan (เยี่ยมกะทันหัน) --</option>
              {preCallPlans.map((plan: any) => (
                <option
                  key={plan.id}
                  value={plan.id}
                  disabled={plan.hasReport}
                  style={plan.hasReport ? { color: '#9CA3AF', backgroundColor: '#F3F4F6' } : {}}
                >
                  {plan.customer?.name} - {format(new Date(plan.planDate), 'dd/MM/yyyy HH:mm')}
                  {plan.objectives && ` - ${plan.objectives.substring(0, 50)}${plan.objectives.length > 50 ? '...' : ''}`}
                  {plan.hasReport && ' (มีรายงานแล้ว)'}
                </option>
              ))}
            </select>
            {selectedPlanId && (
              <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ข้อมูลจาก Pre-Call Plan ถูก auto-fill แล้ว
              </p>
            )}
            {!selectedPlanId && preCallPlans.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                ไม่พบ Pre-Call Plan ที่ได้รับอนุมัติ - สามารถสร้างรายงานแบบไม่มีแผนได้
              </p>
            )}
          </div>
        </div>

        {/* Customer & Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">ข้อมูลลูกค้า</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ลูกค้า <span className="text-error">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={!!selectedPlanId}
                required
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} (Class {customer.type})
                  </option>
                ))}
              </select>
              {selectedPlanId && (
                <p className="text-xs text-blue-600 mt-1">จาก Pre-Call Plan</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ผู้ติดต่อ <span className="text-error">*</span>
              </label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={!!selectedPlanId || !formData.customerId || contacts.length === 0}
                required
              >
                <option value="">-- เลือกผู้ติดต่อ --</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.position && `(${contact.position})`}
                  </option>
                ))}
              </select>
              {selectedPlanId && (
                <p className="text-xs text-blue-600 mt-1">จาก Pre-Call Plan</p>
              )}
              {formData.customerId && contacts.length === 0 && !selectedPlanId && (
                <p className="text-sm text-muted-foreground mt-1">
                  ไม่พบผู้ติดต่อสำหรับลูกค้านี้
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Call Details */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">รายละเอียดการเยี่ยม</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                วันที่เยี่ยม <span className="text-error">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.callDate}
                onChange={(e) => setFormData(prev => ({ ...prev, callDate: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ประเภทการเยี่ยม <span className="text-error">*</span>
              </label>
              <select
                value={formData.callActivityType}
                onChange={(e) => setFormData(prev => ({ ...prev, callActivityType: e.target.value as ActivityType }))}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="FACE_TO_FACE">พบหน้า (Face-to-Face)</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activities Done */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            กิจกรรมที่ทำ <span className="text-error">*</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activityTypes
              .filter((activity, index, self) =>
                // Remove duplicates by nameTh
                index === self.findIndex((a) => a.nameTh === activity.nameTh)
              )
              .map((activity) => {
                const isSelected = formData.activitiesDone.includes(activity.nameTh);
                const icon = getActivityIcon(activity.nameEn || activity.nameTh);

                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleActivityToggle(activity.nameTh)}
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
                      {activity.nameTh}
                    </div>

                    {/* English Name (if available) */}
                    {activity.nameEn && (
                      <div className={`text-xs mt-1 text-center line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {activity.nameEn}
                      </div>
                    )}

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

          {formData.activitiesDone.length === 0 && (
            <p className="text-sm text-error mt-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              กรุณาเลือกกิจกรรมอย่างน้อย 1 รายการ
            </p>
          )}
        </div>

        {/* Customer Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">ข้อมูลจากลูกค้า</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ความคิดเห็นของลูกค้า (Customer Response)
              </label>
              <textarea
                value={formData.customerResponse}
                onChange={(e) => setFormData(prev => ({ ...prev, customerResponse: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกความคิดเห็นของลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ความต้องการของลูกค้า (Customer Request)
              </label>
              <textarea
                value={formData.customerRequest}
                onChange={(e) => setFormData(prev => ({ ...prev, customerRequest: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกความต้องการของลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ข้อโต้แย้ง (Customer Objections)
              </label>
              <textarea
                value={formData.customerObjections}
                onChange={(e) => setFormData(prev => ({ ...prev, customerObjections: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกข้อโต้แย้งของลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ความต้องการเพิ่มเติม (Customer Needs)
              </label>
              <textarea
                value={formData.customerNeeds}
                onChange={(e) => setFormData(prev => ({ ...prev, customerNeeds: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกความต้องการเพิ่มเติม..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ข้อร้องเรียน (Customer Complaints)
              </label>
              <textarea
                value={formData.customerComplaints}
                onChange={(e) => setFormData(prev => ({ ...prev, customerComplaints: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="บันทึกข้อร้องเรียน..."
              />
            </div>
          </div>
        </div>

        {/* Quick Actions: Check-in & Photo */}
        <div className="bg-gradient-to-r from-violet-500 to-blue-500 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">📸 Quick Actions</h2>
          <p className="text-white/80 text-sm mb-4">
            บันทึก Call Report ก่อน แล้วค่อยถ่ายรูปและ Check-in ได้ในหน้ารายละเอียด
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => router.push('/check-in')}
              className="bg-white/90 hover:bg-white backdrop-blur-sm border-2 border-white rounded-xl p-4 shadow-xl transition-all flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 text-violet-600">
                📍
              </div>
              <span className="font-bold text-sm text-violet-700">Check-in</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/quick-photo')}
              className="bg-white/90 hover:bg-white backdrop-blur-sm border-2 border-white rounded-xl p-4 shadow-xl transition-all flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 text-blue-600">
                📷
              </div>
              <span className="font-bold text-sm text-blue-700">ถ่ายรูป</span>
            </button>
          </div>
        </div>

        {/* Next Action */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">การติดตามครั้งถัดไป</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Next Action
            </label>
            <textarea
              value={formData.nextAction}
              onChange={(e) => setFormData(prev => ({ ...prev, nextAction: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="บันทึกสิ่งที่จะทำในการเยี่ยมครั้งถัดไป..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกฉบับร่าง'}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

// Wrap with Suspense to support useSearchParams
export default function CreateCallReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <CreateCallReportPageContent />
    </Suspense>
  );
}
