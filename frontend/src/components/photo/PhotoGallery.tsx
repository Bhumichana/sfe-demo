/**
 * PhotoGallery Component
 *
 * แสดงรูปภาพทั้งหมดในรูปแบบ grid
 * รองรับการลบรูป, แสดง category, และ loading state
 */

'use client';

import { PhotoQueueItem, PHOTO_CATEGORIES, MAX_PHOTOS_PER_REPORT } from './types';

interface PhotoGalleryProps {
  photos: PhotoQueueItem[];
  onDelete?: (photoId: string) => void;
  onPhotoClick?: (photo: PhotoQueueItem) => void;
  readOnly?: boolean;
  maxPhotos?: number;
}

export default function PhotoGallery({
  photos,
  onDelete,
  onPhotoClick,
  readOnly = false,
  maxPhotos = MAX_PHOTOS_PER_REPORT,
}: PhotoGalleryProps) {
  const getCategoryLabel = (category: string) => {
    const cat = PHOTO_CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.icon} ${cat.label}` : category;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">ยังไม่มีรูปภาพ</p>
        <p className="text-xs text-gray-400 mt-1">กดปุ่มถ่ายรูปเพื่อเริ่มต้น</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-foreground">
            รูปภาพทั้งหมด ({photos.length}/{maxPhotos})
          </h3>
        </div>

        {/* Progress indicator */}
        {photos.length >= maxPhotos && (
          <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded-full">
            ครบจำนวนแล้ว
          </span>
        )}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 group"
          >
            {/* Photo Image */}
            <img
              src={photo.preview}
              alt={photo.category}
              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => onPhotoClick?.(photo)}
            />

            {/* Uploading Overlay */}
            {photo.uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-1"></div>
                  <p className="text-xs text-white">กำลังอัปโหลด...</p>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {photo.uploaded && (
              <div className="absolute top-2 right-2">
                <div className="bg-success rounded-full p-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {photo.error && (
              <div className="absolute inset-0 bg-error/90 flex items-center justify-center">
                <div className="text-center px-2">
                  <svg className="w-6 h-6 text-white mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs text-white">{photo.error}</p>
                </div>
              </div>
            )}

            {/* Category Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
              <p className="text-xs text-white font-medium truncate">
                {getCategoryLabel(photo.category)}
              </p>
            </div>

            {/* Delete Button */}
            {!readOnly && onDelete && !photo.uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id);
                }}
                className="absolute top-2 left-2 bg-error rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-error/90"
                aria-label="ลบรูป"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Photo count warning */}
      {photos.length > maxPhotos * 0.8 && photos.length < maxPhotos && (
        <div className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg">
          ⚠️ เหลืออีก {maxPhotos - photos.length} รูป
        </div>
      )}
    </div>
  );
}
