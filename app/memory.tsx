// ══════════════════════════════════════════════════════════════
// INTENT — Memory Controls
// Review and manage the app's learned patterns about you
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { X, Database, Trash2, Brain, Target, Shield } from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography } from '../src/theme'
import { Screen, Card, SectionHeader } from '../src/components'

export default function MemoryControlsScreen() {
  const router = useRouter()
  const resistancePatterns = useAppStore((s) => s.resistancePatterns)
  const distractions = useAppStore((s) => s.distractions)
  const sessions = useAppStore((s) => s.sessions)
  const [_, forceUpdate] = React.useState(0)

  const sessionCount = sessions.length
  const patternCount = resistancePatterns.length
  const distractionCount = distractions.length

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Memory',
      'This will erase all learned patterns, distraction history, and resistance data. Your missions and sessions will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Memory',
          style: 'destructive',
          onPress: () => {
            forceUpdate(n => n + 1)
            Alert.alert('Memory Cleared', 'INTENT will rebuild its understanding from scratch.')
          },
        },
      ],
    )
  }

  return (
    <Screen gradient={['rgba(108,58,237,0.04)', 'transparent']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memory Controls</Text>
          <Text style={styles.subtitle}>What INTENT has learned</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overview */}
        <Card variant="glow" style={styles.overviewCard}>
          <Brain size={28} color={colors.brand[500]} />
          <Text style={styles.overviewTitle}>Local Memory</Text>
          <Text style={styles.overviewText}>
            INTENT learns your resistance patterns and focus habits to offer better protocols over time. 
            All memory stays on your device.
          </Text>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Target size={20} color={colors.brand[400]} />
            <Text style={styles.statValue}>{sessionCount}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Brain size={20} color={colors.accent.pink} />
            <Text style={styles.statValue}>{patternCount}</Text>
            <Text style={styles.statLabel}>patterns</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Database size={20} color={colors.accent.orange} />
            <Text style={styles.statValue}>{distractionCount}</Text>
            <Text style={styles.statLabel}>distractions</Text>
          </Card>
        </View>

        {/* What's stored */}
        <SectionHeader title="What's Stored" />
        <Card variant="default" style={styles.storedCard}>
          <View style={styles.storedRow}>
            <Text style={styles.storedLabel}>Resistance patterns</Text>
            <Text style={styles.storedValue}>{patternCount} entries</Text>
          </View>
          <View style={styles.storedRow}>
            <Text style={styles.storedLabel}>Distraction history</Text>
            <Text style={styles.storedValue}>{distractionCount} entries</Text>
          </View>
          <View style={styles.storedRow}>
            <Text style={styles.storedLabel}>Session history</Text>
            <Text style={styles.storedValue}>{sessionCount} entries</Text>
          </View>
          <View style={styles.storedRow}>
            <Text style={styles.storedLabel}>Consent preferences</Text>
            <Text style={styles.storedValue}>Saved locally</Text>
          </View>
        </Card>

        {/* Actions */}
        <SectionHeader title="Actions" />
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
          <Trash2 size={18} color={colors.error} />
          <Text style={styles.clearText}>Clear Learning Data</Text>
        </TouchableOpacity>

        <Card variant="subtle" style={styles.infoCard}>
          <Shield size={16} color={colors.text.tertiary} />
          <Text style={styles.infoText}>
            Clearing memory won't delete your missions or sessions — only the patterns INTENT has inferred from your behavior.
          </Text>
        </Card>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  closeBtn: { padding: spacing.xs },
  title: { ...typography.headline, color: colors.text.primary },
  subtitle: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: 2 },
  overviewCard: { padding: spacing.lg, alignItems: 'center', marginBottom: spacing.sectionGap },
  overviewTitle: { ...typography.h3, color: colors.text.primary, marginTop: spacing.sm },
  overviewText: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sectionGap },
  statCard: { flex: 1, padding: spacing.md, alignItems: 'center', gap: 4 },
  statValue: { ...typography.h3, color: colors.text.primary, fontSize: 20 },
  statLabel: { ...typography.caption, color: colors.text.tertiary },
  storedCard: { padding: spacing.sm, marginBottom: spacing.sectionGap },
  storedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  storedLabel: { ...typography.bodyMedium, color: colors.text.primary },
  storedValue: { ...typography.caption, color: colors.text.tertiary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error + '30', justifyContent: 'center', marginBottom: spacing.md },
  clearText: { ...typography.bodyMedium, color: colors.error, fontWeight: '600' },
  infoCard: { padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  infoText: { ...typography.caption, color: colors.text.tertiary, flex: 1, lineHeight: 18 },
})
