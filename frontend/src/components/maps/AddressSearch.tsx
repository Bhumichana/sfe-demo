'use client';

import { useState, useEffect } from 'react';
import { debouncedGeocodeAddress, GeocodeResult } from '@/services/geocoding';

interface AddressSearchProps {
  onSelectLocation: (lat: number, lng: number, address: string) => void;
  placeholder?: string;
}

export default function AddressSearch({
  onSelectLocation,
  placeholder = 'ค้นหาที่อยู่หรือสถานที่...',
}: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchAddress = async () => {
      if (query.trim().length < 3) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await debouncedGeocodeAddress(query, 'th', 1000);
        setResults(searchResults);
        setShowResults(true);
      } catch (err) {
        setError('ไม่สามารถค้นหาที่อยู่ได้ กรุณาลองใหม่อีกครั้ง');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchAddress();
  }, [query]);

  const handleSelectResult = (result: GeocodeResult) => {
    onSelectLocation(result.lat, result.lng, result.display_name);
    setQuery('');
    setShowResults(false);
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
          ) : (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.display_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.trim().length >= 3 && !loading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">ไม่พบผลการค้นหา</p>
        </div>
      )}
    </div>
  );
}
