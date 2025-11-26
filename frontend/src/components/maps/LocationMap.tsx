'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  currentLocation: {
    lat: number;
    lng: number;
  };
  customerLocation?: {
    lat: number | string; // Support Prisma Decimal (string)
    lng: number | string; // Support Prisma Decimal (string)
    name: string;
    address?: string;
  };
  distance?: number; // in meters
  maxDistance?: number; // threshold in meters
  height?: string;
  showDistanceCircle?: boolean;
}

// Component to automatically adjust map bounds
function MapBounds({
  currentLocation,
  customerLocation
}: {
  currentLocation: { lat: number; lng: number };
  customerLocation?: { lat: number | string; lng: number | string }
}) {
  const map = useMap();

  useEffect(() => {
    if (customerLocation) {
      // Convert to numbers (handle Prisma Decimal)
      const custLat = Number(customerLocation.lat);
      const custLng = Number(customerLocation.lng);

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [currentLocation.lat, currentLocation.lng],
        [custLat, custLng]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    } else {
      // Center on current location
      map.setView([currentLocation.lat, currentLocation.lng], 16);
    }
  }, [map, currentLocation, customerLocation]);

  return null;
}

export default function LocationMap({
  currentLocation,
  customerLocation,
  distance,
  maxDistance = 10,
  height = '400px',
  showDistanceCircle = true,
}: LocationMapProps) {
  // Convert all locations to numbers (handle Prisma Decimal)
  const currentLat = Number(currentLocation.lat);
  const currentLng = Number(currentLocation.lng);
  const customerLat = customerLocation ? Number(customerLocation.lat) : null;
  const customerLng = customerLocation ? Number(customerLocation.lng) : null;

  // Default center (Bangkok)
  const defaultCenter: [number, number] = [13.7563, 100.5018];
  const center: [number, number] = [currentLat, currentLng];

  const isWithinRange = distance !== undefined && distance <= maxDistance;

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current location marker */}
        <Marker position={center} icon={currentLocationIcon}>
          <Popup>
            <div className="text-sm">
              <strong className="text-blue-600">Your Location</strong>
              <div className="text-xs text-gray-600 mt-1">
                {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Customer location marker and distance indicators */}
        {customerLocation && customerLat !== null && customerLng !== null && (
          <>
            <Marker
              position={[customerLat, customerLng]}
              icon={customerLocationIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="text-red-600">{customerLocation.name}</strong>
                  {customerLocation.address && (
                    <div className="text-xs text-gray-600 mt-1">{customerLocation.address}</div>
                  )}
                  <div className="text-xs text-gray-600 mt-1">
                    {customerLat.toFixed(6)}, {customerLng.toFixed(6)}
                  </div>
                  {distance !== undefined && (
                    <div className={`text-xs font-semibold mt-2 ${isWithinRange ? 'text-green-600' : 'text-red-600'}`}>
                      Distance: {Math.round(distance)}m {isWithinRange ? '✅' : '❌'}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Distance threshold circle around customer */}
            {showDistanceCircle && (
              <Circle
                center={[customerLat, customerLng]}
                radius={maxDistance}
                pathOptions={{
                  color: isWithinRange ? '#10B981' : '#EF4444',
                  fillColor: isWithinRange ? '#10B981' : '#EF4444',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}

            {/* Line connecting the two points */}
            <Polyline
              positions={[
                [currentLat, currentLng],
                [customerLat, customerLng],
              ]}
              pathOptions={{
                color: isWithinRange ? '#10B981' : '#EF4444',
                weight: 3,
                dashArray: '5, 10',
              }}
            />
          </>
        )}

        {/* Auto-adjust map bounds */}
        <MapBounds
          currentLocation={{ lat: currentLat, lng: currentLng }}
          customerLocation={customerLocation}
        />
      </MapContainer>
    </div>
  );
}
