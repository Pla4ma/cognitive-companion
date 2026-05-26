// ══════════════════════════════════════════════════════════════
// INTENT — Font System
// Platform-aware font tokens (loaded via expo-font)
// Falls back to system fonts when custom fonts aren't loaded
// ══════════════════════════════════════════════════════════════

// Use 'react-native' Platform at runtime only; these constants are safe for jest
const platform = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
  ? require('react-native').Platform
  : { OS: 'web', select: (obj: any) => obj.default || Object.values(obj)[0] }

// System font stacks — guaranteed to work without expo-font loading
const SYSTEM_FONTS = {
  body: platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  bodyMedium: platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  bold: platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  display: platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  mono: platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const

// Custom font names — only valid after expo-font loads them
const CUSTOM_FONTS = {
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bold: 'Inter-SemiBold',
  display: 'PlusJakartaSans-Bold',
  mono: 'JetBrainsMono-Bold',
} as const

// Set to true after fonts are loaded via useFonts
let fontsLoaded = false

export function setFontsLoaded(loaded: boolean) {
  fontsLoaded = loaded
}

export const fonts = {
  get body() { return fontsLoaded ? CUSTOM_FONTS.body : SYSTEM_FONTS.body },
  get bodyMedium() { return fontsLoaded ? CUSTOM_FONTS.bodyMedium : SYSTEM_FONTS.bodyMedium },
  get bold() { return fontsLoaded ? CUSTOM_FONTS.bold : SYSTEM_FONTS.bold },
  get display() { return fontsLoaded ? CUSTOM_FONTS.display : SYSTEM_FONTS.display },
  get mono() { return fontsLoaded ? CUSTOM_FONTS.mono : SYSTEM_FONTS.mono },
} as const
