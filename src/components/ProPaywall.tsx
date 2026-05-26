// ══════════════════════════════════════════════════════════════
// INTENT — ProPaywall
// Context-sensitive paywall modal for PRO upgrade triggers
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, X, Zap, Brain, TrendingUp, Shield } from 'lucide-react-native'
import type { PurchasesPackage } from 'react-native-purchases'
import Purchases from 'react-native-purchases'
import { colors, spacing, radius, typography, shadows } from '../theme'
import { getOfferings, purchasePro, restorePurchases } from '../services/purchases'

// ── Trigger Types ──────────────────────────────────────────

export type PaywallTrigger =
  | 'session_5'
  | 'intelligence'
  | 'mission_limit'
  | 'day_14'
  | 'share'

// ── Props ──────────────────────────────────────────────────

interface ProPaywallProps {
  trigger: PaywallTrigger
  visible: boolean
  onDismiss: () => void
  onSuccess: () => void
}

// ── Context-Sensitive Headlines ────────────────────────────

const HEADLINES: Record<PaywallTrigger, { title: string; subtitle: string }> = {
  session_5: {
    title: 'You showed up.',
    subtitle: 'PRO removes daily limits so you never lose momentum.',
  },
  intelligence: {
    title: 'Your patterns are forming.',
    subtitle: 'Unlock the full intelligence map — see what\'s really driving your resistance.',
  },
  mission_limit: {
    title: 'You\'re doing the work.',
    subtitle: 'PRO gives you unlimited missions and AI coaching — no caps.',
  },
  day_14: {
    title: '14 days. You\'re serious.',
    subtitle: 'Unlock weekly narratives, danger windows, and your complete resistance map.',
  },
  share: {
    title: 'Share your progress.',
    subtitle: 'PRO unlocks shareable weekly summary cards with your full story.',
  },
}

// ── PRO Features ───────────────────────────────────────────

const PRO_FEATURES = [
  {
    icon: Brain,
    label: 'Danger window predictions',
    description: 'your hardest hours, mapped',
  },
  {
    icon: TrendingUp,
    label: 'Full history + resistance map',
    description: 'see every pattern',
  },
  {
    icon: Zap,
    label: 'Unlimited AI coaching',
    description: 'zero daily limits',
  },
  {
    icon: Shield,
    label: 'Weekly narrative synthesis',
    description: 'what your week actually meant',
  },
] as const

// ── Component ──────────────────────────────────────────────

export function ProPaywall({
  trigger,
  visible,
  onDismiss,
  onSuccess,
}: ProPaywallProps) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const headline = HEADLINES[trigger]

  // ── Load Offerings ──────────────────────────────────────

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    setLoading(true)
    setError(null)

    getOfferings().then((result) => {
      if (cancelled) return
      setLoading(false)

      if (result.success) {
        setPackages(result.packages)
        // Default to annual (longer period)
        const annual = result.packages.find(
          (p) => p.packageType === Purchases.PACKAGE_TYPE?.ANNUAL
        ) ?? result.packages.find((p) =>
          p.product.identifier.toLowerCase().includes('annual') ||
          p.product.identifier.toLowerCase().includes('year')
        )
        setSelectedPackage(annual ?? result.packages[0] ?? null)
      } else {
        setError(result.error)
      }
    })

    return () => { cancelled = true }
  }, [visible])

  // ── Purchase Handler ────────────────────────────────────

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage || purchasing) return

    setPurchasing(true)
    setError(null)

    const result = await purchasePro(selectedPackage)

    setPurchasing(false)

    if (result.success) {
      onSuccess()
    } else if (!result.userCancelled) {
      setError(result.error)
    }
  }, [selectedPackage, purchasing, onSuccess])

  // ── Restore Handler ─────────────────────────────────────

  const handleRestore = useCallback(async () => {
    if (restoring) return

    setRestoring(true)
    setError(null)

    const result = await restorePurchases()

    setRestoring(false)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error)
    }
  }, [restoring, onSuccess])

  // ── Helpers ─────────────────────────────────────────────

  type PackageType = 'annual' | 'monthly' | 'other'

  const parsePackageType = (pkg: PurchasesPackage): PackageType => {
    const id = pkg.product.identifier.toLowerCase()
    if (id.includes('annual') || id.includes('year')) return 'annual'
    if (id.includes('month')) return 'monthly'
    return 'other'
  }

  const getPackageLabel = (pkg: PurchasesPackage): string => {
    const type = parsePackageType(pkg)
    if (type === 'annual') return 'Annual'
    if (type === 'monthly') return 'Monthly'
    return pkg.product.title ?? 'Plan'
  }

  const getPackagePrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString ?? '$0'
  }

  const getPackagePeriod = (pkg: PurchasesPackage): string => {
    const type = parsePackageType(pkg)
    if (type === 'annual') return '/year'
    if (type === 'monthly') return '/month'
    return ''
  }

  const isAnnual = (pkg: PurchasesPackage): boolean => {
    return parsePackageType(pkg) === 'annual'
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={40}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Close Button ── */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.title}>{headline.title}</Text>
              <Text style={styles.subtitle}>{headline.subtitle}</Text>
            </View>

            {/* ── Features List ── */}
            <View style={styles.features}>
              {PRO_FEATURES.map(({ icon: Icon, label, description }) => (
                <View key={label} style={styles.featureRow}>
                  <View style={styles.featureCheck}>
                    <Check size={14} color={colors.brand[400]} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureLabel}>{label}</Text>
                    <Text style={styles.featureDesc}>— {description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* ── Loading State ── */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brand[400]} />
              </View>
            )}

            {/* ── Pricing Options ── */}
            {!loading && packages.length > 0 && (
              <View style={styles.pricing}>
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.identifier === pkg.identifier
                  const annual = isAnnual(pkg)

                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[
                        styles.priceOption,
                        isSelected && styles.priceOptionSelected,
                        annual && styles.priceOptionAnnual,
                      ]}
                      onPress={() => setSelectedPackage(pkg)}
                      activeOpacity={0.7}
                    >
                      {annual && (
                        <View style={styles.bestValueBadge}>
                          <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                      )}

                      <View style={styles.priceContent}>
                        <View style={styles.priceLeft}>
                          <Text style={[
                            styles.priceLabel,
                            isSelected && styles.priceLabelSelected,
                          ]}>
                            {getPackageLabel(pkg)}
                          </Text>
                          <Text style={styles.priceAmount}>
                            {getPackagePrice(pkg)}
                            <Text style={styles.pricePeriod}>
                              {getPackagePeriod(pkg)}
                            </Text>
                          </Text>
                        </View>

                        <View style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* ── Error ── */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* ── CTA Button ── */}
            {!loading && (
              <TouchableOpacity
                style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
                onPress={handlePurchase}
                activeOpacity={0.8}
                disabled={purchasing || !selectedPackage}
              >
                <LinearGradient
                  colors={[colors.brand[500], colors.brand[400], colors.brand[300]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  {purchasing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.ctaText}>Start Free Trial</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* ── Free Trial Note ── */}
            <Text style={styles.trialNote}>
              7-day free trial · Cancel anytime
            </Text>

            {/* ── Restore ── */}
            <TouchableOpacity
              onPress={handleRestore}
              disabled={restoring}
              style={styles.restoreButton}
            >
              {restoring ? (
                <ActivityIndicator size="small" color={colors.text.tertiary} />
              ) : (
                <Text style={styles.restoreText}>Restore purchases</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  container: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '92%',
    overflow: 'hidden',
    ...shadows.glow,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + (Platform.OS === 'ios' ? 34 : spacing.lg),
  },

  // Close
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bg.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headline,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // Features
  features: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  featureDesc: {
    ...typography.body,
    color: colors.text.tertiary,
    marginLeft: spacing.xxs,
  },

  // Loading
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },

  // Pricing
  pricing: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priceOption: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.elevated,
    padding: spacing.md,
    overflow: 'hidden',
  },
  priceOptionSelected: {
    borderColor: colors.brand[400],
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  priceOptionAnnual: {
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.brand[400],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderBottomLeftRadius: radius.sm,
  },
  bestValueText: {
    ...typography.labelSmall,
    color: '#fff',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  priceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLeft: {
    gap: 2,
  },
  priceLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  priceLabelSelected: {
    color: colors.text.primary,
  },
  priceAmount: {
    ...typography.h2,
    color: colors.text.primary,
  },
  pricePeriod: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },

  // Radio
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.brand[400],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.brand[400],
  },

  // Error
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // CTA
  ctaButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.glow,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  ctaText: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 17,
  },

  // Trial Note
  trialNote: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Restore
  restoreButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  restoreText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
})
