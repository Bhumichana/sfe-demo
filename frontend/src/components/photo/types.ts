/**
 * Photo-related types for multi-photo upload feature
 */

export type PhotoCategory = 'PRODUCT' | 'POP_POSM' | 'CUSTOMER' | 'ACTIVITY' | 'OTHER';

export interface PhotoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface PhotoQueueItem {
  id: string;
  file: File;
  preview: string; // base64 data URL
  category: PhotoCategory;
  location: PhotoLocation | null;
  timestamp: Date;
  uploaded?: boolean;
  uploading?: boolean;
  error?: string;
}

export interface UploadedPhoto {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  category: PhotoCategory;
  location: PhotoLocation | null;
  timestamp: string;
  sizeBytes: number;
}

export const PHOTO_CATEGORIES: Array<{ value: PhotoCategory; label: string; icon: string }> = [
  { value: 'PRODUCT', label: 'สินค้า', icon: '📦' },
  { value: 'POP_POSM', label: 'POP/POSM', icon: '🎨' },
  { value: 'CUSTOMER', label: 'ลูกค้า', icon: '🏢' },
  { value: 'ACTIVITY', label: 'กิจกรรม', icon: '🎯' },
  { value: 'OTHER', label: 'อื่นๆ', icon: '📷' },
];

export const MAX_PHOTOS_PER_REPORT = 10;
