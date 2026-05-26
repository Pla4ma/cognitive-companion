// ══════════════════════════════════════════════════════════════
// INTENT — Drift Mirror Card
// Compact card showing a Drift Mirror insight in feeds
// ══════════════════════════════════════════════════════════════

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native'

interface DriftMirrorInsight {
  id: string
  beforeState: string
  actionTaken: string
  outcome: string
  learnedRule: string
  shareableText?: string
}

interface Props {
  insight: DriftMirrorInsight
  onPress?: (id: string) => void
  onShare?: (id: string) => void
}

export function DriftMirrorCard({ insight, onPress, onShare }: Props): React.JSX.Element {
  const stateIcon = (state: string) => {
    const icons: Record<string, string> = {
      overwhelmed: '🌊',
      stuck: '🧊',
      tired: '😴',
      anxious: '⚡',
      perfectionism: '💎',
      doomscroll_risk: '📱',
      low_energy: '🔋',
    }
    return icons[state] || '🌀'
  }

  const outcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'completed': return '#00ff88'
      case 'started': return '#66aaff'
      case 'salvaged': return '#ffaa00'
      case 'partial': return '#ff8844'
      default: return '#888'
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: insight.shareableText || `I rescued a moment: ${insight.actionTaken}`,
      })
      onShare?.(insight.id)
    } catch {}
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(insight.id)}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <Text style={styles.icon}>{stateIcon(insight.beforeState)}</Text>
        <View style={styles.stateInfo}>
          <Text style={styles.stateLabel}>
            {insight.beforeState.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.stateSub}>almost drifted here</Text>
        </View>
        <View style={[styles.outcomeBadge, { borderColor: outcomeColor(insight.outcome) }]}>
          <Text style={[styles.outcomeText, { color: outcomeColor(insight.outcome) }]}>
            {insight.outcome}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <Text style={styles.actionLabel}>What saved it:</Text>
        <Text style={styles.actionText}>{insight.actionTaken}</Text>
      </View>

      <View style={styles.ruleRow}>
        <Text style={styles.ruleIcon}>💡</Text>
        <Text style={styles.ruleText} numberOfLines={2}>
          {insight.learnedRule}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
        <Text style={styles.tapHint}>Tap for full mirror</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 28, marginRight: 12 },
  stateInfo: { flex: 1 },
  stateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  stateSub: { fontSize: 12, color: '#888', marginTop: 1 },
  outcomeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  outcomeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
  actionRow: { marginBottom: 10 },
  actionLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  actionText: { fontSize: 14, color: '#e0e0e0', fontWeight: '600' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  ruleIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
  ruleText: { flex: 1, fontSize: 13, color: '#00ff88', lineHeight: 20, fontStyle: 'italic' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00ff8820',
    borderWidth: 1,
    borderColor: '#00ff8830',
  },
  shareText: { fontSize: 13, color: '#00ff88', fontWeight: '600' },
  tapHint: { fontSize: 11, color: '#555' },
})
