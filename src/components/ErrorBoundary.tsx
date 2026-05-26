// ══════════════════════════════════════════════════════════════
// INTENT — Error Boundary
// Production crash resilience with graceful degradation.
// Catches rendering errors and shows a recovery screen instead of crashing.
// ══════════════════════════════════════════════════════════════

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../theme'

interface Props {
  children: ReactNode
  fallback?: ReactErrorFallback
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: unknown[]
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

type ReactErrorFallback = (props: {
  error: Error
  resetError: () => void
  showDetails: boolean
  toggleDetails: () => void
}) => ReactNode

function DefaultErrorFallback({ error, resetError, showDetails, toggleDetails }: {
  error: Error
  resetError: () => void
  showDetails: boolean
  toggleDetails: () => void
}) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={48} color={colors.accent.orange} />
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          INTENT hit an unexpected error. Don't worry — your data is safe.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={resetError} activeOpacity={0.8}>
          <RefreshCw size={18} color={colors.text.inverse} />
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={toggleDetails} activeOpacity={0.8}>
          <Bug size={16} color={colors.text.tertiary} />
          <Text style={styles.secondaryBtnText}>Show Details</Text>
        </TouchableOpacity>

        {showDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details</Text>
            <Text style={styles.detailsText}>{error.message}</Text>
            {error.stack && (
              <Text style={styles.stackText}>{error.stack.slice(0, 500)}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || []
      const currentKeys = this.props.resetKeys
      const hasChanged = currentKeys.some((key, i) => key !== prevKeys[i])
      if (hasChanged) {
        this.resetError()
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError,
          showDetails: this.state.showDetails,
          toggleDetails: this.toggleDetails,
        })
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          showDetails={this.state.showDetails}
          toggleDetails={this.toggleDetails}
        />
      )
    }

    return this.props.children
  }
}

// ── Screen-level wrapper ─────────────────────────────────────

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactErrorFallback
) {
  return function WrappedScreen(props: P) {
    return (
      <ErrorBoundary fallback={fallback} resetKeys={[props]}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accent.orange + '15',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.xl,
  },
  title: { ...typography.headline, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm },
  message: { ...typography.bodyMedium, color: colors.text.tertiary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.brand[500], borderRadius: radius.xxl,
    paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  primaryBtnText: { ...typography.button, color: colors.text.inverse },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  secondaryBtnText: { ...typography.bodySmall, color: colors.text.tertiary },
  detailsContainer: {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  detailsTitle: { ...typography.labelSmall, color: colors.text.tertiary, marginBottom: spacing.xs },
  detailsText: { ...typography.bodySmall, color: colors.text.secondary, fontFamily: 'monospace' },
  stackText: { ...typography.bodySmall, color: colors.text.disabled, fontFamily: 'monospace', marginTop: spacing.xs, fontSize: 10 },
})
