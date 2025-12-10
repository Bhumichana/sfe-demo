/**
 * PhotoManagementSection Component
 *
 * Section สำหรับจัดการรูปภาพในฟอร์ม Call Report
 * ใช้ใน Create และ Edit pages
 */

'use client';

import { useState } from 'react';
import CameraModal from './CameraModal';
import PhotoGallery from './PhotoGallery';
import { usePhotoUpload } from './usePhotoUpload';
import { PhotoCategory, PhotoLocation, MAX_PHOTOS_PER_REPORT } from './types';

interface PhotoManagementSectionProps {
  userId: string;
  userName: string;
  userUsername: string;
  callReportId?: string; // Optional - ถ้ายังไม่ได้บันทึก draft
  onPhotosChange?: (photoCount: number) => void;
  disabled?: boolean;
}

export default function PhotoManagementSection({
  userId,
  userName,
  userUsername,
  callReportId,
  onPhotosChange,
  disabled = false,
}: PhotoManagementSectionProps) {
  const [showCamera, setShowCamera] = useState(false);

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
    userId,
    callReportId,
    maxPhotos: MAX_PHOTOS_PER_REPORT,
    onUploadComplete: () => {
      onPhotosChange?.(photoQueue.length);
    },
  });

  const handleCapture = (file: File, category: PhotoCategory, location: PhotoLocation | null) => {
    const photo = addPhoto(file, category, location);
    if (photo) {
      onPhotosChange?.(photoQueue.length + 1);
    }
  };

  const handleRemove = (photoId: string) => {
    removePhoto(photoId);
    onPhotosChange?.(photoQueue.length - 1);
  };

  const handleUploadAll = async () => {
    if (!callReportId) {
      alert('กรุณาบันทึก Call Report ก่อนอัปโหลดรูป');
      return;
    }

    const result = await uploadAll();

    if (result.failed > 0) {
      alert(
        `อัปโหลดเสร็จสิ้น!\n\n✅ สำเร็จ: ${result.success} รูป\n❌ ล้มเหลว: ${result.failed} รูป`
      );
    } else if (result.success > 0) {
      alert(`✅ อัปโหลดสำเร็จทั้งหมด ${result.success} รูป!`);
      clearQueue();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          รูปภาพ
        </h3>

        {photoQueue.length > 0 && stats.pending > 0 && (
          <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded-full">
            {stats.pending} รูปรอบันทึก
          </span>
        )}
      </div>

      {/* Photo Gallery */}
      {photoQueue.length > 0 && (
        <PhotoGallery photos={photoQueue} onDelete={handleRemove} maxPhotos={MAX_PHOTOS_PER_REPORT} />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          disabled={disabled || !canAddMore}
          className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {photoQueue.length === 0
            ? 'เพิ่มรูปภาพ'
            : canAddMore
            ? `เพิ่มรูปภาพ (${photoQueue.length}/${MAX_PHOTOS_PER_REPORT})`
            : `ครบจำนวนแล้ว (${MAX_PHOTOS_PER_REPORT})`}
        </button>

        {photoQueue.length > 0 && callReportId && stats.pending > 0 && (
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={uploading}
            className="bg-success text-white px-6 py-3 rounded-lg font-medium hover:bg-success/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                อัปโหลด...
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
                บันทึก ({stats.pending})
              </>
            )}
          </button>
        )}
      </div>

      {/* Info message */}
      {photoQueue.length > 0 && !callReportId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          💡 <strong>หมายเหตุ:</strong> รูปภาพจะถูกบันทึกหลังจากที่คุณบันทึก Call Report แล้ว
        </div>
      )}

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        mode="multi"
        userName={userName}
        userUsername={userUsername}
      />
    </div>
  );
}
