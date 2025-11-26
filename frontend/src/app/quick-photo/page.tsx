'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { CallReport } from '@/types';
import MainLayout from '@/components/layouts/MainLayout';
import { format } from 'date-fns';
import { callReportsApi } from '@/services/api';

type PhotoCategory = 'product' | 'pop_posm' | 'customer' | 'activity' | 'other';

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
}

interface CapturedPhoto {
  dataUrl: string;
  blob: Blob;
  timestamp: Date;
  location: Location | null;
  category: PhotoCategory;
}

const PHOTO_CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: 'product', label: '📦 สินค้า (Product)' },
  { value: 'pop_posm', label: '🎨 POP/POSM' },
  { value: 'customer', label: '🏢 ลูกค้า (Customer)' },
  { value: 'activity', label: '🎯 กิจกรรม (Activity)' },
  { value: 'other', label: '📷 อื่นๆ (Other)' },
];

export default function QuickPhotoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('product');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [callReports, setCallReports] = useState<CallReport[]>([]);
  const [selectedCallReportId, setSelectedCallReportId] = useState<string>('');
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    getCurrentLocation();

    // Check if callReportId is passed via query params
    const callReportIdParam = searchParams.get('callReportId');
    if (callReportIdParam) {
      setSelectedCallReportId(callReportIdParam);
    }

    if (user) {
      loadCallReports();
    }
  }, [isAuthenticated, user, router, searchParams]);

  useEffect(() => {
    return () => {
      // Cleanup: stop camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const loadCallReports = async () => {
    if (!user) return;

    try {
      setLoadingReports(true);
      // Load draft and submitted call reports
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());

      setStream(mediaStream);
      setCameraActive(true);

      // Wait for next frame before setting srcObject
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (!videoRef.current) {
            resolve();
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            resolve();
          };
        });

        // Play the video
        if (videoRef.current) {
          console.log('Playing video...');
          await videoRef.current.play();
          console.log('Video is playing');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง\n\nError: ' + (error as Error).message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const flipCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Add watermark
    addWatermark(ctx, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto({
          dataUrl,
          blob,
          timestamp: new Date(),
          location: currentLocation,
          category: selectedCategory,
        });
        stopCamera();
      }
    }, 'image/jpeg', 0.85);
  };

  const addWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = 20;
    const fontSize = Math.max(16, Math.floor(width / 60));

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, height - (fontSize * 4 + padding * 2), width, fontSize * 4 + padding * 2);

    // White text
    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';

    const lines = [];

    // Timestamp
    lines.push(`📅 ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`);

    // Location
    if (currentLocation) {
      lines.push(`📍 ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`);
    }

    // User
    if (user) {
      lines.push(`👤 ${user.fullName} (${user.username})`);
    }

    // Category
    const categoryLabel = PHOTO_CATEGORIES.find(c => c.value === selectedCategory)?.label || '';
    lines.push(`🏷️ ${categoryLabel}`);

    // Draw lines
    lines.forEach((line, index) => {
      ctx.fillText(line, padding, height - (fontSize * (3 - index) + padding));
    });
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedPhoto || !user) return;

    // Check if call report is selected
    if (!selectedCallReportId) {
      alert('กรุณาเลือก Call Report ที่จะแนบรูป');
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('photo', capturedPhoto.blob, `photo-${Date.now()}.jpg`);
      formData.append('category', capturedPhoto.category);
      formData.append('userId', user.id);
      formData.append('callReportId', selectedCallReportId);

      if (capturedPhoto.location) {
        formData.append('lat', capturedPhoto.location.lat.toString());
        formData.append('lng', capturedPhoto.location.lng.toString());
      }

      // Upload to server
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      alert('Upload สำเร็จ!\n\nรูปถูกแนบกับ Call Report แล้ว');

      // Navigate back to call report (or edit page if returnTo=edit)
      const returnTo = searchParams.get('returnTo');
      if (returnTo === 'edit') {
        router.push(`/call-reports/${selectedCallReportId}/edit`);
      } else {
        router.push(`/call-reports/${selectedCallReportId}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
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
    <MainLayout title="Quick Photo" subtitle="ถ่ายรูปหน้างานพร้อม GPS" showBackButton={true}>
      <div className="space-y-6">
        {!cameraActive && !capturedPhoto && (
          <>
            {/* Select Call Report */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">📋 เลือก Call Report</h3>

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
                >
                  <option value="">-- เลือก Call Report --</option>
                  {callReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.customer?.name || 'ลูกค้า'} - {format(new Date(report.callDate), 'dd/MM/yyyy')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select Category */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">📸 เลือกประเภทรูป</h3>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {PHOTO_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCategory === category.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={startCamera}
                disabled={!selectedCallReportId}
                className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedCallReportId ? 'เปิดกล้อง' : 'เลือก Call Report ก่อนถ่ายรูป'}
              </button>
            </div>
          </>
        )}

        {cameraActive && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ minHeight: '300px' }}>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-auto"
                style={{ minHeight: '300px' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={flipCamera}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                พลิกกล้อง
              </button>

              <button
                onClick={capturePhoto}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                ถ่ายรูป
              </button>

              <button
                onClick={stopCamera}
                className="flex-1 bg-error text-white py-3 rounded-lg font-medium hover:bg-error/90 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {capturedPhoto && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">ตรวจสอบรูปถ่าย</h3>

            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <img
                src={capturedPhoto.dataUrl}
                alt="Captured"
                className="w-full h-auto"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">ประเภท:</span>
                <span className="font-medium">
                  {PHOTO_CATEGORIES.find(c => c.value === capturedPhoto.category)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">เวลา:</span>
                <span className="font-medium">
                  {format(capturedPhoto.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                </span>
              </div>
              {capturedPhoto.location && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">ตำแหน่ง:</span>
                  <span className="font-mono text-xs">
                    {capturedPhoto.location.lat.toFixed(6)}, {capturedPhoto.location.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={retakePhoto}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                ถ่ายใหม่
              </button>

              <button
                onClick={uploadPhoto}
                disabled={uploading}
                className="flex-1 bg-success text-white py-3 rounded-lg font-semibold hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '⏳ กำลังอัปโหลด...' : '☁️ อัปโหลด'}
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </MainLayout>
  );
}
