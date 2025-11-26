// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// App Configuration
export const APP_NAME = 'SFE Mobile';
export const APP_VERSION = '1.0.0';

// Demo Users
export const DEMO_USERS = {
  manager: { username: 'manager', role: 'SM' as const, label: 'Sales Manager' },
  sales1: { username: 'sales1', role: 'SR' as const, label: 'Sales Rep 1' },
  sales2: { username: 'sales2', role: 'SR' as const, label: 'Sales Rep 2' },
  pm: { username: 'pm', role: 'PM' as const, label: 'Product Manager' },
};

// Customer Classification Thresholds (monthly revenue in THB)
export const CUSTOMER_CLASS_THRESHOLDS = {
  A: 500000, // > 500K = Class A (VIP)
  B: 100000, // 100K-500K = Class B (Important)
  // < 100K = Class C (Standard)
};

// GPS Configuration
export const GPS_ACCURACY_THRESHOLD = 10; // meters

// Storage Configuration
export const MAX_STORAGE_SIZE = 100 * 1024 * 1024 * 1024; // 100GB in bytes

// Auth Configuration
export const TOKEN_KEY = 'sfe_access_token';
export const USER_KEY = 'sfe_user';
