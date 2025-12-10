/**
 * CameraModal Component
 *
 * Modal สำหรับถ่ายรูปที่รองรับ:
 * - Single capture mode (ถ่ายทีละรูป)
 * - Multi capture mode (ถ่ายหลายรูปต่อเนื่อง)
 * - Category selection
 * - GPS location capture
 * - Photo preview และ retake
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { PhotoCategory, PhotoLocation, PHOTO_CATEGORIES } from './types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, category: PhotoCategory, location: PhotoLocation | null) => void;
  mode?: 'single' | 'multi';
  userName?: string;
  userUsername?: string;
  initialCategory?: PhotoCategory;
}

export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
  mode = 'multi',
  userName,
  userUsername,
  initialCategory = 'PRODUCT',
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>(initialCategory);
  const [currentLocation, setCurrentLocation] = useState<PhotoLocation | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Get current location
  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
  }, [isOpen]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhoto]);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    setTimeout(() => startCamera(), 100);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Add watermark
    addWatermark(ctx, canvas.width, canvas.height);

    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
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
    if (userName && userUsername) {
      lines.push(`👤 ${userName} (${userUsername})`);
    }

    // Category
    const categoryLabel = PHOTO_CATEGORIES.find((c) => c.value === selectedCategory);
    if (categoryLabel) {
      lines.push(`🏷️ ${categoryLabel.icon} ${categoryLabel.label}`);
    }

    // Draw lines
    lines.forEach((line, index) => {
      ctx.fillText(line, padding, height - (fontSize * (3 - index) + padding));
    });
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!capturedPhoto) return;

    // Convert data URL to File
    fetch(capturedPhoto)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, selectedCategory, currentLocation);

        // Reset for next photo in multi mode
        if (mode === 'multi') {
          setCapturedPhoto(null);
          startCamera();
        } else {
          handleClose();
        }
      });
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-lg font-bold">
              {mode === 'multi' ? 'ถ่ายรูปหลายรูป' : 'ถ่ายรูป'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View / Preview */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {/* Video Stream */}
          {!capturedPhoto && (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
            />
          )}

          {/* Photo Preview */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Controls Overlay */}
          {!capturedPhoto && cameraActive && (
            <div className="absolute top-4 right-4">
              <button
                onClick={switchCamera}
                className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                title="สลับกล้อง"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div className="bg-gray-900 text-white p-4">
          <label className="block text-sm font-medium mb-2">หมวดหมู่รูปภาพ:</label>
          <div className="grid grid-cols-5 gap-2">
            {PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCategory === cat.value
                    ? 'border-primary bg-primary/20 scale-105'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-center gap-4">
          {!capturedPhoto ? (
            // Capture button
            <button
              onClick={capturePhoto}
              disabled={!cameraActive}
              className="bg-white text-gray-900 p-4 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : (
            // Retake and Confirm buttons
            <>
              <button
                onClick={retakePhoto}
                className="flex-1 bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                ถ่ายใหม่
              </button>
              <button
                onClick={confirmPhoto}
                className="flex-1 bg-success text-white py-3 px-6 rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {mode === 'multi' ? 'ถ่ายรูปเพิ่ม' : 'ใช้รูปนี้'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
