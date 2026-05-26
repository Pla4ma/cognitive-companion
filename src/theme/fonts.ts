// ══════════════════════════════════════════════════════════════
// INTENT — Font System
// Platform-aware font tokens (loaded via expo-font)
// ══════════════════════════════════════════════════════════════

// Use 'react-native' Platform at runtime only; these constants are safe for jest
const platform = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
  ? require('react-native').Platform
  : { OS: 'web', select: (obj: any) => obj.default || Object.values(obj)[0] }

export const fonts = {
  body: platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'System' }),
  bodyMedium: platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium', default: 'System' }),
  bold: platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'System' }),
  display: platform.select({ ios: 'PlusJakartaSans-Bold', android: 'PlusJakartaSans-Bold', default: 'System' }),
  mono: platform.select({ ios: 'JetBrainsMono-Bold', android: 'JetBrainsMono-Bold', default: 'monospace' }),
} as const
