export const colors = {
  background: '#111827',
  surface: '#1F2937',
  card: '#1F2937',
  border: '#374151',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textDisabled: '#6B7280',
  teacherPrimary: '#3B82F6',
  teacherLight: '#1E3A5F',
  studentPrimary: '#10B981',
  studentLight: '#064E3B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  dangerLight: '#7F1D1D',
  warningLight: '#78350F',
} as const;

export const spacing = {
  xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  s: 4, m: 8, l: 12, xl: 20, full: 999,
} as const;

export const fontSize = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 28,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
