// ══════════════════════════════════════════════════════════════
// INTENT — Root Layout
// Stack navigator with proper tab integration
// ══════════════════════════════════════════════════════════════

import { Stack } from 'expo-router'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { colors } from '../src/theme'
import { GlobalErrorBoundary } from '../src/services/errorBoundary'
import { initCrashReporting, setConsentMode } from '../src/services/crashReporting'
import { useAppStore } from '../src/store'
import { checkForUpdates } from '../src/services/updates'

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const checkConsent = useAppStore(s => s.checkConsent)

  // Hide splash screen immediately since we don't require custom fonts
  useEffect(() => {
    SplashScreen.hideAsync()
    // Check for OTA updates after a short delay
    setTimeout(() => void checkForUpdates(), 3000)
  }, [])

  // Initialize crash reporting on mount, gated by consent
  useEffect(() => {
    initCrashReporting(SENTRY_DSN)
    setConsentMode(checkConsent('crash_reporting'))
  }, [checkConsent])

  // Wire notification system for danger windows after enough sessions
  useEffect(() => {
    const sessions = useAppStore.getState().sessions
    if (sessions.length >= 5) {
      try {
        const { predictDrift } = require('../src/engine/predictiveEngine')
        const { scheduleDangerWindowNotifications } = require('../src/services/notifications')
        const prediction = predictDrift({ sessions })
        if (prediction?.dangerWindows?.length > 0) {
          void scheduleDangerWindowNotifications(prediction.dangerWindows, { totalSessions: sessions.length })
        }
      } catch {}
    }
  }, [])

  return (
    <GlobalErrorBoundary>
     <GestureHandlerRootView style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
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
    backgroundColor: colors.bg.base,
  },
})
