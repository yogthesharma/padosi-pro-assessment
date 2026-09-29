/** Palette taken from app.padosipro.com so the app feels like the same product. */
export const colors = {
  primary: '#155C49',
  primaryPressed: '#133E35',
  primaryMuted: '#E8F8F3',
  accent: '#C9A84C',
  accentMuted: '#FDF6E3',
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F4F7',
  border: '#D0D5DD',
  text: '#101828',
  textMuted: '#667085',
  textSubtle: '#344054',
  error: '#B42318',
  errorMuted: '#FFF1F0',
  warning: '#B54708',
  warningMuted: '#FFFAEB',
  success: '#027A48',
  successMuted: '#ECFDF3',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  bodyMuted: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, color: colors.textSubtle },
  caption: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
};
