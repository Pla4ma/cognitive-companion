// ══════════════════════════════════════════════════════════════
// INTENT — Shareable Proof (Phase 25)
// Share cards that don't expose private data
// Types: Rescue Card, Comeback Card, Weekly Story Card, Before Scroll Card
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Share2, X, Eye, EyeOff } from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../src/theme'

export type ShareCardType = 'rescue' | 'comeback' | 'weekly' | 'before_scroll'

export interface ShareCardData {
  type: ShareCardType
  state?: string
  duration?: number
  outcome?: string
  protocol?: string
  rescuedCount?: number
  bestProtocol?: string
  anonymizedCategory?: string
  showState: boolean
  showDuration: boolean
  customText: string
}

interface ShareCardPreviewProps {
  data: ShareCardData
}

function ShareCardPreview({ data }: ShareCardPreviewProps) {
  const getTitle = () => {
    switch (data.type) {
      case 'rescue': return 'Almost drifted. Rescued.'
      case 'comeback': return 'Failed. Shrunk it. Came back.'
      case 'weekly': return `This week: ${data.rescuedCount || 0} rescued moments.`
      case 'before_scroll': return 'Scrolled after a tiny win.'
      default: return 'INTENT'
    }
  }

  const getSubtitle = () => {
    if (data.customText) return data.customText
    switch (data.type) {
      case 'rescue':
        return data.showState && data.state
          ? `Was ${data.state}. Did a ${data.duration || 2}-min mission instead.`
          : `Did a ${data.duration || 2}-min mission instead of drifting.`
      case 'comeback':
        return 'This app doesn\'t punish failure. It salvages it.'
      case 'weekly':
        return data.bestProtocol ? `Best pattern: ${data.bestProtocol}` : 'Building momentum, one tiny action at a time.'
      case 'before_scroll':
        return '2 minutes before disappearing. Then chose intentionally.'
      default: return ''
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>INTENT</Text>
        </View>
        <Text style={styles.cardTitle}>{getTitle()}</Text>
        <Text style={styles.cardSubtitle}>{getSubtitle()}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>
          {data.showDuration && data.duration ? `${data.duration} min` : ''}
          {data.showState && data.state ? ` • ${data.state}` : ''}
          {data.anonymizedCategory ? ` • ${data.anonymizedCategory}` : ''}
        </Text>
        <Text style={styles.cardBranding}>intent-app.com</Text>
      </View>
    </View>
  )
}

export default function ShareScreen() {
  const router = useRouter()
  const [cardType, setCardType] = useState<ShareCardType>('rescue')
  const [showState, setShowState] = useState(false)
  const [showDuration, setShowDuration] = useState(true)
  const [customText, setCustomText] = useState('')

  const cardData: ShareCardData = {
    type: cardType,
    state: 'avoiding',
    duration: 5,
    outcome: 'completed',
    protocol: 'two_minute_ignition',
    rescuedCount: 7,
    bestProtocol: 'Ugly First Move',
    anonymizedCategory: 'study',
    showState,
    showDuration,
    customText,
  }

  const handleShare = () => {
    // In production, this would use expo-sharing or react-native-share
    // For now, just go back
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Win</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Preview */}
        <ShareCardPreview data={cardData} />

        {/* Card Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CARD TYPE</Text>
          <View style={styles.typeGrid}>
            {([
              { id: 'rescue', label: 'Rescue', emoji: '⚡' },
              { id: 'comeback', label: 'Comeback', emoji: '🔄' },
              { id: 'weekly', label: 'Weekly', emoji: '📊' },
              { id: 'before_scroll', label: 'Before Scroll', emoji: '📱' },
            ] as const).map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeChip, cardType === type.id && styles.typeChipActive]}
                onPress={() => setCardType(type.id)}
              >
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                <Text style={[styles.typeLabel, cardType === type.id && styles.typeLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRIVACY</Text>

          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyLabel}>Show state label</Text>
              <Text style={styles.privacyHint}>e.g. "avoiding", "overwhelmed"</Text>
            </View>
            <Switch
              value={showState}
              onValueChange={setShowState}
              trackColor={{ false: colors.border.subtle, true: colors.brand[400] }}
            />
          </View>

          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyLabel}>Show duration</Text>
              <Text style={styles.privacyHint}>e.g. "5 min"</Text>
            </View>
            <Switch
              value={showDuration}
              onValueChange={setShowDuration}
              trackColor={{ false: colors.border.subtle, true: colors.brand[400] }}
            />
          </View>

          <View style={styles.privacyNote}>
            <EyeOff size={14} color={colors.text.tertiary} />
            <Text style={styles.privacyNoteText}>
              Your actual mission text is never shared. Only categories and outcomes.
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Share2 size={20} color={colors.text.inverse} />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.xl,
  },
  headerTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  content: { padding: spacing.lg },

  // Card Preview
  card: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.border.subtle,
    minHeight: 200, justifyContent: 'space-between',
  },
  cardHeader: { marginBottom: spacing.lg },
  brandBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.brand[400] + '20',
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.sm, marginBottom: spacing.md,
  },
  brandText: { ...typography.caption, color: colors.brand[400], fontWeight: '700', letterSpacing: 1 },
  cardTitle: { ...typography.h2, color: colors.text.primary, fontSize: 20, marginBottom: spacing.xs },
  cardSubtitle: { ...typography.bodyMedium, color: colors.text.secondary, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFooterText: { ...typography.caption, color: colors.text.tertiary },
  cardBranding: { ...typography.caption, color: colors.brand[400], fontWeight: '600' },

  // Sections
  section: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.labelSmall, color: colors.text.tertiary, marginBottom: spacing.sm },

  // Type Grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
  },
  typeChipActive: { borderColor: colors.brand[400], backgroundColor: colors.brand[400] + '10' },
  typeEmoji: { fontSize: 16 },
  typeLabel: { ...typography.bodySmall, color: colors.text.secondary },
  typeLabelActive: { color: colors.brand[400], fontWeight: '600' },

  // Privacy
  privacyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  privacyInfo: { flex: 1 },
  privacyLabel: { ...typography.bodyMedium, color: colors.text.primary },
  privacyHint: { ...typography.caption, color: colors.text.tertiary },
  privacyNote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.bg.elevated, borderRadius: radius.md,
  },
  privacyNoteText: { ...typography.caption, color: colors.text.tertiary, flex: 1 },

  // Share
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.brand[400], borderRadius: radius.lg, padding: spacing.md,
  },
  shareText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
})
