export const colors = {
  // Primary colors (based on screenshots - purple/indigo theme)
  primary: '#6366F1',      // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',

  secondary: '#8B5CF6',    // Purple variant

  // Status colors
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Orange
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue

  // Background
  background: '#F3F4F6',   // Light gray
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Text
  text: '#1F2937',         // Dark gray
  textSecondary: '#6B7280', // Medium gray
  textLight: '#9CA3AF',    // Light gray
  textWhite: '#FFFFFF',

  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Badge/Status
  approved: '#10B981',
  rejected: '#EF4444',
  pending: '#F59E0B',
  draft: '#6B7280',

  // Customer types
  customerA: '#EF4444',    // Red for VIP
  customerB: '#F59E0B',    // Orange for Important
  customerC: '#6B7280',    // Gray for Standard

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
