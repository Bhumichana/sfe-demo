/**
 * usePhotoUpload Hook
 *
 * Custom hook สำหรับจัดการการอัปโหลดรูปภาพหลายรูป
 * รองรับ batch upload และ error handling
 */

'use client';

import { useState, useCallback } from 'react';
import { PhotoQueueItem, PhotoCategory, PhotoLocation, MAX_PHOTOS_PER_REPORT } from './types';

interface UsePhotoUploadOptions {
  userId: string;
  callReportId?: string;
  maxPhotos?: number;
  onUploadComplete?: (photo: PhotoQueueItem) => void;
  onUploadError?: (photoId: string, error: string) => void;
  onAllComplete?: () => void;
}

export function usePhotoUpload({
  userId,
  callReportId,
  maxPhotos = MAX_PHOTOS_PER_REPORT,
  onUploadComplete,
  onUploadError,
  onAllComplete,
}: UsePhotoUploadOptions) {
  const [photoQueue, setPhotoQueue] = useState<PhotoQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  /**
   * เพิ่มรูปเข้า queue
   */
  const addPhoto = useCallback(
    (file: File, category: PhotoCategory, location: PhotoLocation | null) => {
      // ตรวจสอบจำนวนรูป
      if (photoQueue.length >= maxPhotos) {
        alert(`สามารถถ่ายรูปได้สูงสุด ${maxPhotos} รูปเท่านั้น`);
        return null;
      }

      const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // สร้าง preview URL
      const preview = URL.createObjectURL(file);

      const newPhoto: PhotoQueueItem = {
        id,
        file,
        preview,
        category,
        location,
        timestamp: new Date(),
        uploaded: false,
        uploading: false,
      };

      setPhotoQueue((prev) => [...prev, newPhoto]);
      return newPhoto;
    },
    [photoQueue.length, maxPhotos]
  );

  /**
   * ลบรูปจาก queue
   */
  const removePhoto = useCallback((photoId: string) => {
    setPhotoQueue((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo) {
        // Revoke object URL เพื่อประหยัด memory
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  /**
   * ล้าง queue ทั้งหมด
   */
  const clearQueue = useCallback(() => {
    // Revoke all object URLs
    photoQueue.forEach((photo) => {
      URL.revokeObjectURL(photo.preview);
    });
    setPhotoQueue([]);
  }, [photoQueue]);

  /**
   * อัปโหลดรูปเดี่ยว
   */
  const uploadSinglePhoto = useCallback(
    async (photo: PhotoQueueItem): Promise<boolean> => {
      try {
        // Update uploading status
        setPhotoQueue((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, uploading: true, error: undefined } : p))
        );

        const formData = new FormData();
        formData.append('photo', photo.file);
        formData.append('category', photo.category);
        formData.append('userId', userId);

        if (callReportId) {
          formData.append('callReportId', callReportId);
        }

        if (photo.location) {
          formData.append('lat', photo.location.lat.toString());
          formData.append('lng', photo.location.lng.toString());
        }

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Update uploaded status
        setPhotoQueue((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, uploading: false, uploaded: true }
              : p
          )
        );

        onUploadComplete?.(photo);
        return true;
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด';

        // Update error status
        setPhotoQueue((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, uploading: false, uploaded: false, error: errorMessage }
              : p
          )
        );

        onUploadError?.(photo.id, errorMessage);
        return false;
      }
    },
    [userId, callReportId, onUploadComplete, onUploadError]
  );

  /**
   * อัปโหลดทุกรูปใน queue
   */
  const uploadAll = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (photoQueue.length === 0) {
      return { success: 0, failed: 0 };
    }

    setUploading(true);

    let successCount = 0;
    let failedCount = 0;

    // Upload sequentially เพื่อไม่ให้ server ทำงานหนักเกินไป
    for (const photo of photoQueue) {
      if (!photo.uploaded && !photo.uploading) {
        const success = await uploadSinglePhoto(photo);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
    }

    setUploading(false);
    onAllComplete?.();

    return { success: successCount, failed: failedCount };
  }, [photoQueue, uploadSinglePhoto, onAllComplete]);

  /**
   * Retry อัปโหลดรูปที่ล้มเหลว
   */
  const retryFailedUploads = useCallback(async () => {
    const failedPhotos = photoQueue.filter((p) => p.error && !p.uploaded);

    if (failedPhotos.length === 0) {
      return { success: 0, failed: 0 };
    }

    setUploading(true);

    let successCount = 0;
    let failedCount = 0;

    for (const photo of failedPhotos) {
      const success = await uploadSinglePhoto(photo);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    setUploading(false);

    return { success: successCount, failed: failedCount };
  }, [photoQueue, uploadSinglePhoto]);

  return {
    photoQueue,
    uploading,
    canAddMore: photoQueue.length < maxPhotos,
    addPhoto,
    removePhoto,
    clearQueue,
    uploadAll,
    uploadSinglePhoto,
    retryFailedUploads,
    stats: {
      total: photoQueue.length,
      uploaded: photoQueue.filter((p) => p.uploaded).length,
      failed: photoQueue.filter((p) => p.error).length,
      pending: photoQueue.filter((p) => !p.uploaded && !p.error).length,
    },
  };
}
