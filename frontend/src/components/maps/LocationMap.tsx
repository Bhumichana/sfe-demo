'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue with Webpack
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
  showCoordinates?: boolean;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to update map view when props change
function MapUpdater({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);

  return null;
}

export default function LocationMap({
  lat = 13.7563,
  lng = 100.5018,
  zoom = 13,
  onLocationSelect,
  readOnly = false,
  height = '400px',
  showCoordinates = true,
}: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [isMounted, setIsMounted] = useState(false);

  // Handle SSR - only render map on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  const handleLocationSelect = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    if (onLocationSelect) {
      onLocationSelect(newLat, newLng);
    }
  };

  const handleMarkerDrag = (e: L.DragEndEvent) => {
    const marker = e.target;
    const newPosition = marker.getLatLng();
    handleLocationSelect(newPosition.lat, newPosition.lng);
  };

  // Don't render map on server side
  if (!isMounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <p className="text-gray-500">กำลังโหลดแผนที่...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-border shadow-sm">
        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={position}
            icon={icon}
            draggable={!readOnly}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
          />

          {!readOnly && <MapClickHandler onLocationSelect={handleLocationSelect} />}

          <MapUpdater lat={position[0]} lng={position[1]} zoom={zoom} />
        </MapContainer>
      </div>

      {showCoordinates && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-border">
          <p className="text-sm text-gray-600">
            <span className="font-medium">พิกัด:</span>{' '}
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}
