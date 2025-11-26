'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layouts/MainLayout';
import { format } from 'date-fns';

interface Photo {
  url: string;
  filename: string;
  category: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export default function MyPhotosPage() {
  const router = useRouter();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user) {
      loadPhotos();
    }
  }, [isAuthenticated, user, router]);

  const loadPhotos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get photos for current user
      const response = await fetch(`/api/my-photos?userId=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      } else {
        console.error('Failed to load photos');
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('ต้องการลบรูปนี้ใช่หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: photo.filename }),
      });

      if (response.ok) {
        alert('ลบรูปสำเร็จ');
        loadPhotos(); // Reload photos
      } else {
        alert('ไม่สามารถลบรูปได้');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('เกิดข้อผิดพลาดในการลบรูป');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      product: '📦 สินค้า',
      pop_posm: '🎨 POP/POSM',
      customer: '🏢 ลูกค้า',
      activity: '🎯 กิจกรรม',
      other: '📷 อื่นๆ',
    };
    return categories[category] || category;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout title="My Photos" subtitle="รูปภาพที่ถ่ายไว้ทั้งหมด" showBackButton={true}>
      <div className="space-y-6">
        {/* Header with action button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            รูปภาพทั้งหมด: {photos.length} รูป
          </div>
          <button
            onClick={() => router.push('/quick-photo')}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            📷 ถ่ายรูปใหม่
          </button>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">ยังไม่มีรูปภาพ</h3>
            <p className="text-muted-foreground mb-6">เริ่มถ่ายรูปเพื่อบันทึกการทำงานของคุณ</p>
            <button
              onClick={() => router.push('/quick-photo')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              📷 ถ่ายรูปเลย
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={photo.url}
                    alt={photo.category}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    {getCategoryLabel(photo.category)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    📅 {photo.timestamp ? format(new Date(photo.timestamp), 'dd/MM/yyyy HH:mm') : 'ไม่ระบุ'}
                  </div>
                  {photo.location && (
                    <div className="text-xs text-muted-foreground">
                      📍 {photo.location.lat.toFixed(6)}, {photo.location.lng.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-lg">รายละเอียดรูปภาพ</h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.category}
                  className="w-full rounded-lg mb-4"
                />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">ประเภท:</span>
                    <span className="text-sm font-medium">
                      {getCategoryLabel(selectedPhoto.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">วันที่:</span>
                    <span className="text-sm font-medium">
                      {selectedPhoto.timestamp
                        ? format(new Date(selectedPhoto.timestamp), 'dd/MM/yyyy HH:mm:ss')
                        : 'ไม่ระบุ'}
                    </span>
                  </div>

                  {selectedPhoto.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-24">ตำแหน่ง:</span>
                      <span className="text-sm font-mono">
                        {selectedPhoto.location.lat.toFixed(6)}, {selectedPhoto.location.lng.toFixed(6)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">ไฟล์:</span>
                    <span className="text-sm font-mono text-xs">{selectedPhoto.filename}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      deletePhoto(selectedPhoto);
                      setSelectedPhoto(null);
                    }}
                    className="flex-1 bg-error text-white py-3 rounded-lg font-medium hover:bg-error/90 transition-colors"
                  >
                    🗑️ ลบรูป
                  </button>
                  <a
                    href={selectedPhoto.url}
                    download={selectedPhoto.filename}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
                  >
                    💾 ดาวน์โหลด
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
