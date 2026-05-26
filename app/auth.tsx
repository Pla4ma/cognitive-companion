// ══════════════════════════════════════════════════════════════
// INTENT — Auth Screen
// Sign up / Sign in with email + social providers
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Code } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography, shadows } from '../src/theme'
import { Screen, Card, Button } from '../src/components'

type AuthMode = 'signin' | 'signup'

export default function AuthScreen() {
  const router = useRouter()
  const setUser = useAppStore((s) => s.setUser)

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (mode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }

    setLoading(true)
    void 0

    try {
      // In production, this calls Supabase auth
      // For now, create a local user
      const user = {
        id: Date.now().toString(36),
        email: email.trim().toLowerCase(),
        display_name: email.split('@')[0],
        avatar_url: null,
        push_style: 'gentle' as const,
        onboarding_complete: false,
        onboarding_step: 0 as const,
        plan: 'free' as const,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        body_double_enabled: false,
        vault_enabled: false,
        local_only: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setUser(user)
      void 0
      router.replace('/onboarding')
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = (provider: string) => {
    Alert.alert('Coming Soon', `${provider} sign-in will be available in a future update.`)
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setPassword('')
    setConfirmPassword('')
    void 0
  }

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={colors.gradients.brand} style={styles.logoGradient}>
                <Text style={styles.logoText}>FC</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Sign in to continue your focus journey'
                : 'Start building better focus habits today'}
            </Text>
          </View>

          {/* Form */}
          <Card variant="default" style={styles.formCard}>
            {/* Email */}
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.disabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email address to sign in or create an account"
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                placeholderTextColor={colors.text.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                accessibilityLabel="Password"
                accessibilityHint={mode === 'signup' ? 'Create a password with at least 8 characters' : 'Enter your password'}
                textContentType="password"
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} accessibilityRole="button">
                {showPassword ? (
                  <EyeOff size={18} color={colors.text.tertiary} />
                ) : (
                  <Eye size={18} color={colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.text.disabled}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            {/* Forgot Password (signin only) */}
            {mode === 'signin' && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit */}
            <Button
              title={mode === 'signin' ? 'Sign In' : 'Create Account'}
              onPress={handleEmailAuth}
              variant="gradient"
              size="lg"
              loading={loading}
              disabled={loading}
              style={{ width: '100%', marginTop: spacing.sm }}
              iconRight={<ArrowRight size={18} color={colors.text.inverse} />}
            />
          </Card>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialAuth('Google')}
            >
              <Text style={styles.socialIcon}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialAuth('Apple')}
            >
              <Text style={styles.socialIcon}>🍎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialAuth('GitHub')}
            >
              <Code size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Toggle Mode */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoContainer: {
    width: 72, height: 72, borderRadius: 36,
    overflow: 'hidden', marginBottom: spacing.lg,
    ...shadows.glow,
  },
  logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoText: { ...typography.h1, color: colors.text.inverse, fontSize: 28 },
  title: { ...typography.headline, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMedium, color: colors.text.tertiary, textAlign: 'center', lineHeight: 22 },

  formCard: { padding: spacing.lg, marginBottom: spacing.lg },
  inputLabel: { ...typography.label, color: colors.text.secondary, marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border.subtle,
    marginBottom: spacing.md, paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text.primary, ...typography.body, paddingVertical: spacing.md },
  eyeBtn: { padding: spacing.xs },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.md },
  forgotText: { ...typography.bodySmall, color: colors.brand[400] },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border.subtle },
  dividerText: { ...typography.caption, color: colors.text.tertiary, paddingHorizontal: spacing.md },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
  socialBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle,
    justifyContent: 'center', alignItems: 'center',
  },
  socialIcon: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  toggleText: { ...typography.bodySmall, color: colors.text.tertiary },
  toggleLink: { ...typography.bodySmall, color: colors.brand[400], fontWeight: '600' },

  termsText: { ...typography.caption, color: colors.text.disabled, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: colors.brand[400] },
})
