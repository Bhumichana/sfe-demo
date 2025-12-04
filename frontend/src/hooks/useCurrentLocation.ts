import { useState, useCallback } from 'react';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  timestamp: number;
}

export interface UseCurrentLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => void;
  isSupported: boolean;
}

export function useCurrentLocation(): UseCurrentLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Geolocation API is supported
  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  const getCurrentLocation = useCallback(() => {
    if (!isSupported) {
      setError('เบราว์เซอร์ของคุณไม่รองรับ Geolocation API');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(locationData);
        setLoading(false);
        console.log('Location obtained:', locationData);
      },
      (error) => {
        setLoading(false);
        
        // Handle different error types
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('คุณไม่อนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดการอนุญาตในการตั้งค่าเบราว์เซอร์');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบการเชื่อมต่อ GPS');
            break;
          case error.TIMEOUT:
            setError('หมดเวลาในการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง');
            break;
          default:
            setError('เกิดข้อผิดพลาดในการระบุตำแหน่ง');
        }
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // Don't use cached position
      }
    );
  }, [isSupported]);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    isSupported,
  };
}
