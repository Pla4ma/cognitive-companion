// ══════════════════════════════════════════════════════════════
// INTENT — Global Error Boundary
// Catches React render errors and shows a user-friendly screen
// instead of a blank crash. Reports to Sentry when consent granted.
// ══════════════════════════════════════════════════════════════

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { colors, spacing, radius, typography } from '../theme'
import { captureError } from './crashReporting'

// ── Types ───────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

// ── Error Boundary Component ────────────────────────────────

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })

    // Report to Sentry (consent-gated inside captureError)
    captureError(error, {
      componentStack: errorInfo.componentStack ?? 'unknown',
      errorBoundary: 'GlobalErrorBoundary',
    })
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReportBug = (): void => {
    const { error, errorInfo } = this.state
    const details = this.formatErrorDetails(error, errorInfo)

    Alert.alert(
      'Report This Bug',
      'Your crash report has been automatically sent if you enabled crash reporting in Settings. You can also copy the error details below to share manually.',
      [{ text: 'OK' }],
    )
  }

  private handleCopyDetails = async (): Promise<void> => {
    const { error, errorInfo } = this.state
    const details = this.formatErrorDetails(error, errorInfo)
    await Clipboard.setStringAsync(details)
    Alert.alert('Copied', 'Error details copied to clipboard.')
  }

  private formatErrorDetails(
    error: Error | null,
    errorInfo: React.ErrorInfo | null,
  ): string {
    const parts = [
      '=== INTENT Error Report ===',
      `Time: ${new Date().toISOString()}`,
      '',
    ]

    if (error) {
      parts.push(`Error: ${error.name}: ${error.message}`)
      if (error.stack) {
        parts.push('', 'Stack Trace:', error.stack)
      }
    }

    if (errorInfo?.componentStack) {
      parts.push('', 'Component Stack:', errorInfo.componentStack)
    }

    return parts.join('\n')
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          onRetry={this.handleRetry}
          onReportBug={this.handleReportBug}
          onCopyDetails={this.handleCopyDetails}
        />
      )
    }

    return this.props.children
  }
}

// ── Error Screen ────────────────────────────────────────────

interface ErrorScreenProps {
  error: Error | null
  onRetry: () => void
  onReportBug: () => void
  onCopyDetails: () => void
}

function ErrorScreen({
  error,
  onRetry,
  onReportBug,
  onCopyDetails,
}: ErrorScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emoji & Title */}
        <Text style={styles.emoji}>🪲</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app hit an unexpected issue. Your data is safe — this
          only affected the current screen.
        </Text>

        {/* Error Summary (collapsible) */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorLabel}>Error Details</Text>
            <ScrollView
              style={styles.errorScroll}
              nestedScrollEnabled
            >
              <Text style={styles.errorText} selectable>
                {error.name}: {error.message}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onReportBug}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Report Bug</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={onCopyDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.ghostButtonText}>Copy Error Details</Text>
          </TouchableOpacity>
        </View>

        {/* Reassurance */}
        <Text style={styles.footer}>
          If this keeps happening, try restarting the app or
          updating to the latest version.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 340,
    lineHeight: 24,
  },
  errorCard: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  errorLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  errorScroll: {
    maxHeight: 120,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  secondaryButton: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  ghostButton: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  ghostButtonText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
  footer: {
    ...typography.caption,
    color: colors.text.disabled,
    textAlign: 'center',
    maxWidth: 300,
  },
})
