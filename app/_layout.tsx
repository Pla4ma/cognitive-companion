// ══════════════════════════════════════════════════════════════
// INTENT — Root Layout
// Stack navigator with proper tab integration
// ══════════════════════════════════════════════════════════════

import { Stack } from 'expo-router'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { colors } from '../src/theme'
import { useTheme } from '../src/theme/useTheme'
import { setFontsLoaded } from '../src/theme/fonts'
import { GlobalErrorBoundary } from '../src/services/errorBoundary'
import { initCrashReporting, setConsentMode } from '../src/services/crashReporting'
import { useAppStore } from '../src/store'
import { checkForUpdates } from '../src/services/updates'
import { useAmbientEngine } from '../src/hooks/useAmbientEngine'
import { useRouter } from 'expo-router'

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const theme = useTheme()
  const checkConsent = useAppStore(s => s.checkConsent)
  const user = useAppStore(s => s.user)
  const router = useRouter()
  useAmbientEngine()

  // Load custom fonts — falls back to system fonts on error
  const [fontsReady, fontError] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'JetBrainsMono-Bold': require('../assets/fonts/JetBrainsMono-Bold.ttf'),
  })

  // Hide splash screen once fonts are loaded (or on error, falling back to system fonts)
  useEffect(() => {
    if (fontsReady || fontError) {
      setFontsLoaded(!fontError)
      SplashScreen.hideAsync()
      // Check for OTA updates after a short delay
      setTimeout(() => void checkForUpdates(), 3000)
    }
  }, [fontsReady, fontError])

  // Redirect to onboarding if not completed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user || !user.onboarding_complete) {
        router.replace('/onboarding')
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [user?.onboarding_complete])

  // Comeback detection and notification
  useEffect(() => {
    try {
      const state = useAppStore.getState()
      const comeback = state.getComebackStatus?.()
      if (comeback?.isComeback && comeback?.daysAway >= 2) {
        state.recordRetention?.('comeback_started', { state: 'returning', daysAway: comeback.daysAway })
      }
    } catch { /* never crash from comeback detection */ }
  }, [])

  // Schedule danger window notifications when enough data (5+ sessions)
  // Re-runs every 5 sessions
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      const count = state.sessions.length
      if (count >= 5 && count % 5 === 0) {
        try {
          const { buildIntelligenceProfile } = require('../src/engine/predictiveEngine')
          const { scheduleDangerWindowNotifications } = require('../src/services/notifications')
          const profile = buildIntelligenceProfile({
            sessions: state.sessions,
            patterns: state.resistancePatterns,
            distractions: state.distractions,
            momentumEvents: state.momentumEvents,
            missions: state.missions,
            microMissions: state.microMissions,
            brainDumps: state.brainDumps,
          })
          if (profile.dangerWindows.length > 0) {
            void scheduleDangerWindowNotifications(profile.dangerWindows, profile)
          }
        } catch { /* never crash from notification scheduling */ }
      }
    })
    return unsub
  }, [])

  // Initialize crash reporting on mount, gated by consent
  useEffect(() => {
    initCrashReporting(SENTRY_DSN)
    setConsentMode(checkConsent('crash_reporting'))
  }, [checkConsent])

  return (
    <GlobalErrorBoundary>
     <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg.base },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="goals" options={{ title: 'Goals' }} />
        <Stack.Screen name="goals/[id]" options={{ title: 'Goal Detail', presentation: 'card' }} />
        <Stack.Screen name="focus" options={{ title: 'Focus' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress' }} />
        <Stack.Screen name="coach" options={{ title: 'Coach' }} />
        <Stack.Screen name="live" options={{ title: 'Live Mission', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
        <Stack.Screen name="auth" options={{ title: 'Sign In', presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Welcome', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="before-scroll" options={{ title: 'Before You Scroll', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="trust" options={{ title: 'Trust Center', presentation: 'modal' }} />
        <Stack.Screen name="memory" options={{ title: 'Memory Controls', presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
    </GlobalErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
