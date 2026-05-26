/**
 * Light mode color tokens for INTENT.
 * Mirrors the dark theme structure — every key from colors exists here.
 */
export const lightColors = {
  bg: {
    base: '#FAFAFA',
    surface: '#F4F4F6',
    elevated: '#FFFFFF',
    overlay: '#EAEAEE',
    card: '#FFFFFF',
    cardHover: '#F0F0F4',
  },

  text: {
    primary: '#0A0A0F',
    secondary: '#4A4A5E',
    tertiary: '#7A7A8E',
    disabled: '#AEAEBA',
    inverse: '#FFFFFF',
  },

  brand: {
    50: '#F2ECFF',
    100: '#E0D4FF',
    200: '#C4ADFF',
    300: '#A47AFF',
    400: '#8B5CF6',
    500: '#6C3AED',
    600: '#5528CC',
    700: '#3E1A9E',
    800: '#2A1070',
    900: '#1A0A42',
  },

  success: '#059669',
  successBg: '#D1FAE5',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  info: '#2563EB',
  infoBg: '#DBEAFE',

  accent: {
    purple: '#7C3AED',
    pink: '#DB2777',
    green: '#059669',
    orange: '#D97706',
    blue: '#2563EB',
    cyan: '#0891B2',
    red: '#DC2626',
  },

  focus: {
    deep_work: '#7C3AED',
    creative: '#DB2777',
    learning: '#059669',
    rest: '#D97706',
  },

  border: {
    subtle: 'rgba(0,0,0,0.06)',
    default: 'rgba(0,0,0,0.10)',
    strong: 'rgba(0,0,0,0.16)',
    focus: '#7C3AED',
  },

  gradients: {
    brand: ['#7C4FED', '#A78BFA'],
    success: ['#059669', '#34D399'],
    warning: ['#D97706', '#FBBF24'],
    surface: ['#F4F4F6', '#EAEAEE'],
    card: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.01)'],
    glow: ['rgba(124,79,237,0.15)', 'rgba(124,79,237,0)'],
  },
} as const
