'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AddressSearch from './AddressSearch';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">กำลังโหลดแผนที่...</p>
    </div>
  ),
});

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  required?: boolean;
}

export default function LocationPicker({
  initialLat,
  initialLng,
  onLocationChange,
  height = '400px',
  required = false,
}: LocationPickerProps) {
  const [lat, setLat] = useState<number | undefined>(initialLat);
  const [lng, setLng] = useState<number | undefined>(initialLng);
  const [hasLocation, setHasLocation] = useState(false);

  const { location: gpsLocation, loading: gpsLoading, error: gpsError, getCurrentLocation } = useCurrentLocation();

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
      setHasLocation(true);
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (gpsLocation && !gpsLoading) {
      handleLocationSelect(gpsLocation.lat, gpsLocation.lng);
    }
  }, [gpsLocation, gpsLoading]);

  const handleLocationSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setHasLocation(true);
    if (onLocationChange) {
      onLocationChange(newLat, newLng);
    }
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
  };

  const handleAddressSelect = (newLat: number, newLng: number, address: string) => {
    handleLocationSelect(newLat, newLng);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AddressSearch onSelectLocation={handleAddressSelect} />
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {gpsLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span className="hidden sm:inline">กำลังค้นหา...</span>
            </>
          ) : (
            <>
              <span>📍</span>
              <span className="hidden sm:inline">ใช้ตำแหน่งปัจจุบัน</span>
              <span className="sm:hidden">GPS</span>
            </>
          )}
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>❌ เกิดข้อผิดพลาด:</strong> {gpsError}
          </p>
        </div>
      )}

      {gpsLocation && !gpsLoading && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ ใช้ตำแหน่งปัจจุบัน</strong> - ความแม่นยำ: ±{Math.round(gpsLocation.accuracy)} เมตร
          </p>
        </div>
      )}

      {!hasLocation && !gpsLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 วิธีเลือกตำแหน่ง:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>ค้นหาที่อยู่ในช่องค้นหาด้านบน</li>
            <li>กดปุ่ม "ใช้ตำแหน่งปัจจุบัน" เพื่อใช้ GPS</li>
            <li>คลิกบนแผนที่หรือลาก marker</li>
          </ul>
        </div>
      )}

      {lat && lng ? (
        <LocationMap
          lat={lat}
          lng={lng}
          zoom={16}
          onLocationSelect={handleLocationSelect}
          height={height}
          showCoordinates={true}
        />
      ) : (
        <LocationMap
          onLocationSelect={handleLocationSelect}
          height={height}
          showCoordinates={true}
        />
      )}

      {required && !hasLocation && (
        <p className="text-sm text-error">* กรุณาเลือกตำแหน่งที่ตั้ง</p>
      )}
    </div>
  );
}
