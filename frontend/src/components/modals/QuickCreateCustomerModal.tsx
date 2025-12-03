'use client';

import { useState } from 'react';
import { customersApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface QuickCreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
}

export default function QuickCreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickCreateCustomerModalProps) {
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    // type is auto-calculated from monthlyRevenue
    address: '',
    phone: '',
    contactName: '',
    contactPosition: '',
    contactPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.name) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }

    try {
      setSubmitting(true);

      const customer = await customersApi.create({
        name: formData.name,
        // type is auto-calculated from monthlyRevenue (not needed)
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        // Add contact if name is provided
        contact: formData.contactName
          ? {
              name: formData.contactName,
              position: formData.contactPosition || undefined,
              phone: formData.contactPhone || undefined,
            }
          : undefined,
      });

      // Success! Pass customer to parent and close modal
      onSuccess(customer);
      onClose(); // Use onClose directly instead of handleClose to avoid state issues
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      alert(error.response?.data?.message || 'ไม่สามารถสร้างลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      contactName: '',
      contactPosition: '',
      contactPhone: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            สร้างลูกค้าใหม่
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ข้อมูลลูกค้า
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>รหัสลูกค้า</strong> จะถูกสร้างอัตโนมัติโดยระบบ (เช่น CUST0001, CUST0002)
              </p>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อลูกค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="ชื่อบริษัท หรือร้านค้า"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ที่อยู่
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                placeholder="ที่อยู่ของลูกค้า"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทร
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="02-xxx-xxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              ผู้ติดต่อหลัก (Optional)
            </h3>
            <p className="text-sm text-gray-600">
              สามารถเพิ่มผู้ติดต่อได้ทีหลัง หรือกรอกตอนนี้เลยก็ได้
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ติดต่อ
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="ชื่อผู้ติดต่อ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Contact Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ตำแหน่ง
                </label>
                <input
                  type="text"
                  name="contactPosition"
                  value={formData.contactPosition}
                  onChange={handleChange}
                  placeholder="เจ้าของ, ผู้จัดการ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรผู้ติดต่อ
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="08x-xxx-xxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  บันทึกและเลือก
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
