'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layouts/MainLayout';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">กำลังโหลดแผนที่...</p>
    </div>
  ),
});

export default function TestMapPage() {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 13.7563,
    lng: 100.5018,
  });

  const { location, loading, error, getCurrentLocation, isSupported } = useCurrentLocation();

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    console.log('Location selected:', lat, lng);
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
  };

  // Update map when GPS location is obtained
  if (location && !loading) {
    if (selectedLocation.lat !== location.lat || selectedLocation.lng !== location.lng) {
      setSelectedLocation({ lat: location.lat, lng: location.lng });
    }
  }

  return (
    <MainLayout title="ทดสอบแผนที่" subtitle="Test Map Component">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Test 1: Interactive Map */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            1. แผนที่แบบ Interactive (คลิกหรือลากได้)
          </h3>
          <LocationMap
            lat={selectedLocation.lat}
            lng={selectedLocation.lng}
            zoom={13}
            onLocationSelect={handleLocationSelect}
            height="400px"
            showCoordinates={true}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>วิธีใช้:</strong> คลิกบนแผนที่หรือลาก marker เพื่อเลือกตำแหน่งใหม่
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>ตำแหน่งที่เลือก:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {/* Test 2: Read-only Map */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            2. แผนที่แบบ Read-only (ดูอย่างเดียว)
          </h3>
          <LocationMap
            lat={13.7279}
            lng={100.5240}
            zoom={15}
            readOnly={true}
            height="300px"
            showCoordinates={true}
          />
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>ตำแหน่ง:</strong> สนามหลวง (Sanam Luang)
            </p>
            <p className="text-sm text-gray-600">
              <strong>โหมด:</strong> Read-only - ไม่สามารถคลิกหรือลากได้
            </p>
          </div>
        </div>

        {/* Test 3: Different Height */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            3. แผนที่ขนาดเล็ก (200px)
          </h3>
          <LocationMap
            lat={13.7466}
            lng={100.5346}
            zoom={16}
            height="200px"
            showCoordinates={false}
          />
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>ตำแหน่ง:</strong> อนุสาวรีย์ชัยสมรภูมิ (Victory Monument)
            </p>
          </div>
        </div>

        {/* Test 4: GPS Current Location */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            4. ทดสอบ GPS - ใช้ตำแหน่งปัจจุบัน
          </h3>

          {!isSupported && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ เบราว์เซอร์ของคุณไม่รองรับ Geolocation API
              </p>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={handleUseCurrentLocation}
              disabled={loading || !isSupported}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  กำลังค้นหาตำแหน่ง...
                </>
              ) : (
                <>
                  📍 ใช้ตำแหน่งปัจจุบัน
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>❌ เกิดข้อผิดพลาด:</strong> {error}
              </p>
            </div>
          )}

          {location && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✅ พบตำแหน่งปัจจุบัน:</strong>
              </p>
              <p className="text-sm text-green-800 mt-1">
                📍 พิกัด: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
              <p className="text-sm text-green-800">
                🎯 ความแม่นยำ: ±{Math.round(location.accuracy)} เมตร
              </p>
              <p className="text-sm text-green-600 text-xs mt-1">
                เวลา: {new Date(location.timestamp).toLocaleString('th-TH')}
              </p>
            </div>
          )}

          <LocationMap
            lat={selectedLocation.lat}
            lng={selectedLocation.lng}
            zoom={location ? 16 : 13}
            onLocationSelect={handleLocationSelect}
            height="400px"
            showCoordinates={true}
          />
        </div>

        {/* Test 5: Preset Locations */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            5. ทดสอบตำแหน่งต่างๆ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setSelectedLocation({ lat: 13.7563, lng: 100.5018 })}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              กรุงเทพฯ (BKK)
            </button>
            <button
              onClick={() => setSelectedLocation({ lat: 18.7883, lng: 98.9853 })}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              เชียงใหม่ (CNX)
            </button>
            <button
              onClick={() => setSelectedLocation({ lat: 12.9236, lng: 100.8825 })}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              พัทยา (Pattaya)
            </button>
            <button
              onClick={() => setSelectedLocation({ lat: 7.8804, lng: 98.3923 })}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              ภูเก็ต (Phuket)
            </button>
          </div>
          <LocationMap
            lat={selectedLocation.lat}
            lng={selectedLocation.lng}
            zoom={12}
            onLocationSelect={handleLocationSelect}
            height="350px"
            showCoordinates={true}
          />
        </div>
      </div>
    </MainLayout>
  );
}
