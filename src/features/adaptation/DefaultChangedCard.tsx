// ══════════════════════════════════════════════════════════════
// INTENT — Default Changed Card
// Non-modal card shown when a personal default adapts
// ══════════════════════════════════════════════════════════════

import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native'

interface DefaultChange {
  id: string
  field: string
  oldValue: string
  newValue: string
  explanation: string
  confidence: number
  evidenceCount: number
}

interface Props {
  change: DefaultChange
  onAccept?: (id: string) => void
  onRevert?: (id: string) => void
  onLearnMore?: (id: string) => void
}

export function DefaultChangedCard({ change, onAccept, onRevert, onLearnMore }: Props): React.JSX.Element {
  const slideAnim = useRef(new Animated.Value(30)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const confidenceColor = () => {
    if (change.confidence < 0.3) return '#666'
    if (change.confidence < 0.6) return '#ffaa00'
    return '#00ff88'
  }

  const confidenceLabel = () => {
    if (change.confidence < 0.3) return 'Low confidence'
    if (change.confidence < 0.6) return 'Moderate confidence'
    return 'High confidence'
  }

  const fieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      defaultDuration: 'Default Duration',
      defaultProtocol: 'Default Protocol',
      defaultComplexity: 'Mission Complexity',
      defaultTone: 'Coach Tone',
      bodyDoubleDefault: 'Body Double Mode',
      notificationTiming: 'Notification Timing',
      beforeScrollMode: 'Before Scroll Mode',
      missionComplexity: 'Mission Complexity',
    }
    return labels[field] || field.replace(/([A-Z])/g, ' $1').trim()
  }

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🔄</Text>
        <Text style={styles.title}>Default Updated</Text>
        <View style={[styles.confidenceDot, { backgroundColor: confidenceColor() }]} />
      </View>

      <View style={styles.changeRow}>
        <View style={styles.valueBlock}>
          <Text style={styles.valueLabel}>Before</Text>
          <Text style={styles.oldValue}>{change.oldValue}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.valueBlock}>
          <Text style={styles.valueLabel}>After</Text>
          <Text style={styles.newValue}>{change.newValue}</Text>
        </View>
      </View>

      <Text style={styles.fieldName}>{fieldLabel(change.field)}</Text>

      <Text style={styles.explanation}>{change.explanation}</Text>

      <View style={styles.evidenceRow}>
        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceText}>
            Based on {change.evidenceCount} data points
          </Text>
        </View>
        <Text style={[styles.confidenceText, { color: confidenceColor() }]}>
          {confidenceLabel()}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onAccept?.(change.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptText}>Looks Good</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.revertButton}
          onPress={() => onRevert?.(change.id)}
        >
          <Text style={styles.revertText}>Revert</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.learnButton}
          onPress={() => onLearnMore?.(change.id)}
        >
          <Text style={styles.learnText}>Why?</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  icon: { fontSize: 20, marginRight: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  confidenceDot: { width: 10, height: 10, borderRadius: 5 },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 16,
  },
  valueBlock: { alignItems: 'center' },
  valueLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  oldValue: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  newValue: { fontSize: 18, fontWeight: '800', color: '#00ff88' },
  arrow: { fontSize: 20, color: '#555' },
  fieldName: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  evidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#111',
  },
  evidenceText: { fontSize: 11, color: '#888' },
  confidenceText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  revertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
    alignItems: 'center',
  },
  revertText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
  learnButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a2a',
    borderWidth: 1,
    borderColor: '#334',
    alignItems: 'center',
  },
  learnText: { fontSize: 14, color: '#6688ff', fontWeight: '600' },
})
