import { useColorScheme } from 'react-native'
import { colors as darkColors } from './index'
import { lightColors } from './lightColors'

export type ColorTokens = typeof darkColors

/**
 * Returns the appropriate color tokens based on the system color scheme.
 * Always returns dark colors by default (app's design language).
 * Light mode activates when the system is in light mode.
 */
export function useTheme(): ColorTokens {
  const scheme = useColorScheme()
  return scheme === 'light' ? lightColors : darkColors
}

/**
 * Get current theme synchronously (for non-hook contexts like StyleSheet).
 * Falls back to dark theme.
 */
export function getTheme(scheme: 'light' | 'dark' | null | undefined): ColorTokens {
  return scheme === 'light' ? lightColors : darkColors
}
