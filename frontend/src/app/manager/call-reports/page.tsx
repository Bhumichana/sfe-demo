'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';

interface CallReport {
  id: string;
  callDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  callActivityType: 'VIRTUAL' | 'FACE_TO_FACE' | null;
  customerResponse: string | null;
  customerRequest: string | null;
  customerObjections: string | null;
  customerNeeds: string | null;
  customerComplaints: string | null;
  nextAction: string | null;
  durationMinutes: number | null;
  isPlanned: boolean;
  sr: {
    id: string;
    fullName: string;
    email: string;
  };
  customer: {
    id: string;
    code: string;
    name: string;
    type: 'A' | 'B' | 'C';
  };
  contact: {
    id: string;
    name: string;
    position: string | null;
  };
  photos: Array<{
    id: string;
    category: string;
    thumbnailUrl: string | null;
  }>;
  coachingRecords: Array<{
    id: string;
    comments: string;
    rating: number | null;
    manager: {
      id: string;
      fullName: string;
    };
    createdAt: string;
  }>;
}

interface CallReportsResponse {
  total: number;
  reports: CallReport[];
}

export default function CallReportsReviewPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [reports, setReports] = useState<CallReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CallReport | null>(null);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [coachingForm, setCoachingForm] = useState({
    comments: '',
    rating: 5,
  });
  const [submittingCoaching, setSubmittingCoaching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'SUP' && user?.role !== 'SM' && user?.role !== 'PM' && user?.role !== 'MM') {
      router.push('/');
      return;
    }

    fetchCallReports();
  }, [isAuthenticated, user, router]);

  const fetchCallReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manager/call-reports/${user?.id}`
      );

      if (!response.ok) throw new Error('Failed to fetch call reports');

      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching call reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoaching = async () => {
    if (!selectedReport || !coachingForm.comments.trim()) {
      alert('Please provide coaching comments');
      return;
    }

    try {
      setSubmittingCoaching(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/call-reports/${selectedReport.id}/coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            managerId: user?.id,
            comments: coachingForm.comments,
            rating: coachingForm.rating,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add coaching');

      alert('Coaching added successfully!');
      setShowCoachingModal(false);
      setCoachingForm({ comments: '', rating: 5 });
      setSelectedReport(null);
      fetchCallReports();
    } catch (error) {
      console.error('Error adding coaching:', error);
      alert('Failed to add coaching. Please try again.');
    } finally {
      setSubmittingCoaching(false);
    }
  };

  const getCustomerTypeBadge = (type: 'A' | 'B' | 'C') => {
    const colors = {
      A: 'bg-error/10 text-error',
      B: 'bg-warning/10 text-warning',
      C: 'bg-success/10 text-success',
    };
    return colors[type] || 'bg-gray-100 text-gray-500';
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout title="รายงานการเยี่ยม" subtitle="ตรวจสอบและให้ Coaching" showBackButton={true}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-border mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Total Reports: {reports?.total || 0}
              </h2>
            </div>

            {/* Call Reports List */}
            <div className="space-y-4">
              {reports && reports.reports.length > 0 ? (
                reports.reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-lg p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {report.customer.name}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCustomerTypeBadge(report.customer.type)}`}>
                            Class {report.customer.type}
                          </span>
                          {report.isPlanned && (
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                              ตามแผน
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          SR: {report.sr.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ผู้ติดต่อ: {report.contact.name} {report.contact.position && `(${report.contact.position})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {new Date(report.callDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {report.durationMinutes && (
                          <div className="text-xs text-muted-foreground">
                            ระยะเวลา: {report.durationMinutes} นาที
                          </div>
                        )}
                        {report.callActivityType && (
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                            report.callActivityType === 'FACE_TO_FACE'
                              ? 'bg-success/10 text-success'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {report.callActivityType === 'FACE_TO_FACE' ? 'เยี่ยมด้วยตนเอง' : 'ออนไลน์'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* GPS Check-in/Check-out */}
                    {(report.checkInTime || report.checkOutTime) && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {report.checkInTime && (
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-1">
                                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Check-in:
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(report.checkInTime).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          )}
                          {report.checkOutTime && (
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-1">
                                <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Check-out:
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(report.checkOutTime).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Report Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                      {report.customerResponse && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">📝 ความคิดเห็นของลูกค้า:</div>
                          <div className="text-sm text-muted-foreground">{report.customerResponse}</div>
                        </div>
                      )}
                      {report.customerRequest && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">💬 ความต้องการของลูกค้า:</div>
                          <div className="text-sm text-muted-foreground">{report.customerRequest}</div>
                        </div>
                      )}
                      {report.customerObjections && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">⚠️ ข้อโต้แย้ง:</div>
                          <div className="text-sm text-muted-foreground">{report.customerObjections}</div>
                        </div>
                      )}
                      {report.customerNeeds && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">🎯 ความต้องการเพิ่มเติม:</div>
                          <div className="text-sm text-muted-foreground">{report.customerNeeds}</div>
                        </div>
                      )}
                      {report.customerComplaints && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">❌ ข้อร้องเรียน:</div>
                          <div className="text-sm text-error">{report.customerComplaints}</div>
                        </div>
                      )}
                      {report.nextAction && (
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-foreground mb-1">➡️ การติดตามครั้งถัดไป:</div>
                          <div className="text-sm text-muted-foreground">{report.nextAction}</div>
                        </div>
                      )}
                    </div>

                    {/* Photos */}
                    {report.photos.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          รูปภาพ ({report.photos.length})
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {report.photos.slice(0, 6).map((photo) => (
                            <div
                              key={photo.id}
                              className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer group relative"
                            >
                              {photo.thumbnailUrl ? (
                                <>
                                  <img
                                    src={photo.thumbnailUrl}
                                    alt={photo.category || 'รูปภาพ'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                  {photo.category && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 truncate">
                                      {photo.category}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                          {report.photos.length > 6 && (
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                              <span className="text-sm font-medium text-muted-foreground">+{report.photos.length - 6}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Coaching Records */}
                    {report.coachingRecords.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          ประวัติการ Coaching
                        </div>
                        {report.coachingRecords.map((coaching) => (
                          <div key={coaching.id} className="bg-gray-50 rounded-lg p-3 mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {coaching.manager.fullName}
                              </span>
                              {coaching.rating && (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < coaching.rating! ? 'text-warning' : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{coaching.comments}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(coaching.createdAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Coaching Button */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowCoachingModal(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        เพิ่มคำแนะนำ Coaching
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-border">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-foreground">No call reports</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No submitted call reports to review yet
                  </p>
                </div>
              )}
            </div>
          </>
        )}

      {/* Coaching Modal */}
      {showCoachingModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">เพิ่มคำแนะนำ Coaching</h2>
            <p className="text-sm text-muted-foreground mb-4">
              สำหรับ: {selectedReport.customer.name} - {selectedReport.sr.fullName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  คะแนน (1-5 ⭐)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setCoachingForm({ ...coachingForm, rating })}
                      className={`w-10 h-10 rounded-full border-2 font-bold transition-all ${
                        coachingForm.rating >= rating
                          ? 'border-warning bg-warning text-white scale-110'
                          : 'border-gray-300 text-gray-400 hover:border-warning'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1 = ต้องพัฒนามาก | 5 = ยอดเยี่ยม
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  คำแนะนำ <span className="text-error">*</span>
                </label>
                <textarea
                  value={coachingForm.comments}
                  onChange={(e) => setCoachingForm({ ...coachingForm, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder="ระบุคำแนะนำ, จุดแข็ง, จุดที่ควรพัฒนา..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCoachingModal(false);
                    setCoachingForm({ comments: '', rating: 5 });
                    setSelectedReport(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-gray-50 transition-colors"
                  disabled={submittingCoaching}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddCoaching}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingCoaching || !coachingForm.comments.trim()}
                >
                  {submittingCoaching ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
