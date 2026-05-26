// ══════════════════════════════════════════════════════════════
// INTENT — Root Layout
// Stack navigator with proper tab integration
// ══════════════════════════════════════════════════════════════

import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { colors } from '../src/theme'
import { GlobalErrorBoundary } from '../src/services/errorBoundary'
import { initCrashReporting, setConsentMode } from '../src/services/crashReporting'
import { useAppStore } from '../src/store'

// Replace with your actual Sentry DSN from https://sentry.io
const SENTRY_DSN = 'https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  })

  const checkConsent = useAppStore(s => s.checkConsent)

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  // Initialize crash reporting on mount, gated by consent
  useEffect(() => {
    initCrashReporting(SENTRY_DSN)
    setConsentMode(checkConsent('crash_reporting'))
  }, [checkConsent])

  if (!fontsLoaded) return null

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
        <Stack.Screen name="trust" options={{ title: 'Trust Center', presentation: 'modal' }} />
        <Stack.Screen name="auth" options={{ title: 'Sign In', presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Welcome', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="before-scroll" options={{ title: 'Before You Scroll', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="share" options={{ title: 'Share', presentation: 'modal' }} />
        <Stack.Screen name="memory" options={{ title: 'Memory', presentation: 'modal' }} />
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
