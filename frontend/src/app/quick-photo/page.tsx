/**
 * Quick Photo Page (Multi-Photo Version)
 *
 * รองรับการถ่ายรูปหลายรูปและอัปโหลดพร้อมกัน
 * ใช้ reusable components: CameraModal, PhotoGallery, usePhotoUpload
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { CallReport } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';
import { format } from 'date-fns';
import { callReportsApi } from '@/services/api';
import {
  CameraModal,
  PhotoGallery,
  usePhotoUpload,
  PhotoCategory,
  PhotoLocation,
  MAX_PHOTOS_PER_REPORT,
} from '@/components/photo';

function QuickPhotoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, initAuth } = useAuthStore();

  const [callReports, setCallReports] = useState<CallReport[]>([]);
  const [selectedCallReportId, setSelectedCallReportId] = useState<string>('');
  const [loadingReports, setLoadingReports] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Initialize photo upload hook
  const {
    photoQueue,
    uploading,
    canAddMore,
    addPhoto,
    removePhoto,
    clearQueue,
    uploadAll,
    stats,
  } = usePhotoUpload({
    userId: user?.id || '',
    callReportId: selectedCallReportId,
    maxPhotos: MAX_PHOTOS_PER_REPORT,
    onUploadComplete: (photo) => {
      console.log('Photo uploaded:', photo.id);
    },
    onUploadError: (photoId, error) => {
      console.error('Upload error:', photoId, error);
    },
    onAllComplete: () => {
      console.log('All uploads complete!');
    },
  });

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if callReportId is passed via query params
    const callReportIdParam = searchParams.get('callReportId');
    if (callReportIdParam) {
      setSelectedCallReportId(callReportIdParam);
    }

    if (user) {
      loadCallReports();
    }
  }, [isAuthenticated, user, router, searchParams]);

  const loadCallReports = async () => {
    if (!user) return;

    try {
      setLoadingReports(true);
      const allReports = await callReportsApi.findByUser(user.id);

      // Filter only DRAFT and SUBMITTED reports
      const activeReports = allReports.filter(
        (report: any) => report.status === 'DRAFT' || report.status === 'SUBMITTED'
      );

      setCallReports(activeReports);
    } catch (error) {
      console.error('Failed to load call reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleCapture = (file: File, category: PhotoCategory, location: PhotoLocation | null) => {
    const newPhoto = addPhoto(file, category, location);
    if (newPhoto) {
      console.log('Photo added to queue:', newPhoto.id);
    }
  };

  const handleSaveAll = async () => {
    if (photoQueue.length === 0) {
      alert('ยังไม่มีรูปภาพที่จะบันทึก');
      return;
    }

    if (!selectedCallReportId) {
      alert('กรุณาเลือก Call Report');
      return;
    }

    const confirmMsg = `คุณต้องการอัปโหลดรูปทั้งหมด ${photoQueue.length} รูป ใช่หรือไม่?`;
    if (!confirm(confirmMsg)) return;

    const result = await uploadAll();

    if (result.failed > 0) {
      alert(
        `อัปโหลดเสร็จสิ้น!\n\n✅ สำเร็จ: ${result.success} รูป\n❌ ล้มเหลว: ${result.failed} รูป\n\nรูปที่ล้มเหลวจะแสดงสีแดง คุณสามารถลองอัปโหลดใหม่ได้`
      );
    } else {
      alert(`✅ อัปโหลดสำเร็จทั้งหมด ${result.success} รูป!`);

      // Navigate back to call report
      const returnTo = searchParams.get('returnTo');
      if (returnTo === 'edit') {
        router.push(`/call-reports/${selectedCallReportId}/edit`);
      } else {
        router.push(`/call-reports/${selectedCallReportId}`);
      }
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout title="ถ่ายรูปหลายรูป" subtitle="Quick Photo - Multi Capture" showBackButton={true}>
      <div className="space-y-6">
        {/* Select Call Report */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            เลือก Call Report
          </h3>

          {loadingReports ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : callReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">ยังไม่มี Call Report</p>
              <button
                onClick={() => router.push('/call-reports/create')}
                className="text-sm text-primary hover:underline"
              >
                สร้าง Call Report ใหม่
              </button>
            </div>
          ) : (
            <select
              value={selectedCallReportId}
              onChange={(e) => setSelectedCallReportId(e.target.value)}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={photoQueue.length > 0}
            >
              <option value="">-- เลือก Call Report --</option>
              {callReports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.customer?.name || 'ลูกค้า'} - {format(new Date(report.callDate), 'dd/MM/yyyy')}
                  {report.status === 'DRAFT' && ' (Draft)'}
                </option>
              ))}
            </select>
          )}

          {photoQueue.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ ไม่สามารถเปลี่ยน Call Report ได้ เมื่อมีรูปในคิวแล้ว
            </p>
          )}
        </div>

        {/* Photo Gallery */}
        {photoQueue.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <PhotoGallery
              photos={photoQueue}
              onDelete={removePhoto}
              maxPhotos={MAX_PHOTOS_PER_REPORT}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-3">
          {/* Stats */}
          {photoQueue.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-xs text-muted-foreground">รูปทั้งหมด</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-success">{stats.uploaded}</div>
                <div className="text-xs text-muted-foreground">อัปโหลดแล้ว</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-error">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">ล้มเหลว</div>
              </div>
            </div>
          )}

          {/* Camera Button */}
          <button
            onClick={() => setShowCamera(true)}
            disabled={!selectedCallReportId || !canAddMore || uploading}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!selectedCallReportId
              ? 'เลือก Call Report ก่อนถ่ายรูป'
              : !canAddMore
              ? `ครบจำนวนแล้ว (${MAX_PHOTOS_PER_REPORT} รูป)`
              : photoQueue.length === 0
              ? 'เริ่มถ่ายรูป'
              : 'ถ่ายรูปเพิ่ม'}
          </button>

          {/* Save All Button */}
          {photoQueue.length > 0 && (
            <>
              <button
                onClick={handleSaveAll}
                disabled={uploading || stats.uploaded === stats.total}
                className="w-full bg-success text-white py-4 rounded-lg font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    กำลังอัปโหลด... ({stats.uploaded}/{stats.total})
                  </>
                ) : stats.uploaded === stats.total ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    อัปโหลดเสร็จสิ้น
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    บันทึกทั้งหมด ({photoQueue.length} รูป)
                  </>
                )}
              </button>

              {/* Clear Queue Button */}
              <button
                onClick={() => {
                  if (confirm('ต้องการลบรูปทั้งหมดใช่หรือไม่?')) {
                    clearQueue();
                  }
                }}
                disabled={uploading}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ลบรูปทั้งหมด
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        mode="multi"
        userName={user.fullName}
        userUsername={user.username}
      />
    </MainLayout>
  );
}

// Wrap with Suspense to support useSearchParams
export default function QuickPhotoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <QuickPhotoPageContent />
    </Suspense>
  );
}
