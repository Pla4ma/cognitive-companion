// ══════════════════════════════════════════════════════════════
// INTENT — Intent Score Card
// Shows Intent Score with circular progress and breakdown
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { IntentScore, IntentScoreComponents } from '../../engine/intentScore'
import { getScoreDisclaimer } from '../../engine/intentScore'

interface Props {
  score: IntentScore
}

const CIRCLE_SIZE = 120
const STROKE_WIDTH = 8

function getScoreColor(score: number): string {
  if (score >= 70) return '#00ff88'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

const BREAKDOWN_LABELS: Record<keyof IntentScoreComponents, string> = {
  startRate: 'Start rate',
  rescueCompletion: 'Rescue completion',
  salvageRate: 'Salvage rate',
  comebackRate: 'Comeback rate',
  reducedDrift: 'Reduced drift',
  planningLoopAvoidance: 'Planning loop avoidance',
  beforeScrollWins: 'Before-scroll wins',
  missionFit: 'Mission fit',
  consistency: 'Consistency',
}

export const IntentScoreCard: React.FC<Props> = ({ score }) => {
  const [expanded, setExpanded] = useState(false)
  const color = getScoreColor(score.total)
  const circumference = (CIRCLE_SIZE - STROKE_WIDTH) * Math.PI
  const progress = (score.total / 100) * circumference

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        {/* Circular progress */}
        <View style={styles.circleContainer}>
          <View style={styles.circleOuter}>
            <View style={[styles.circleBg, { borderColor: '#2a2a2a' }]} />
            <View style={styles.scoreOverlay}>
              <Text style={[styles.scoreNumber, { color }]}>{score.total}</Text>
              <Text style={styles.scoreUnit}>/ 100</Text>
            </View>
          </View>
        </View>

        {/* Label */}
        <View style={styles.labelSection}>
          <Text style={styles.headline}>{score.label}</Text>
          <Text style={styles.subcopy}>
            Your conversion from stuck → started
          </Text>
          <Text style={styles.description}>{score.description}</Text>
          <Text style={[styles.confidence, { color: color }]}>
            Confidence: {score.confidence}
          </Text>
        </View>
      </View>

      {/* Expanded breakdown */}
      {expanded && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          {Object.entries(score.components).map(([key, value]) => (
            <View key={key} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                {BREAKDOWN_LABELS[key as keyof IntentScoreComponents]}
              </Text>
              <View style={styles.breakdownBar}>
                <View
                  style={[
                    styles.breakdownFill,
                    {
                      width: `${value * 100}%`,
                      backgroundColor: getScoreColor(value * 100),
                    },
                  ]}
                />
              </View>
              <Text style={styles.breakdownValue}>
                {Math.round(value * 100)}%
              </Text>
            </View>
          ))}

          <Text style={styles.disclaimer}>{getScoreDisclaimer()}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleContainer: {
    marginRight: 20,
  },
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBg: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: STROKE_WIDTH,
    opacity: 0.15,
  },
  scoreOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  scoreUnit: {
    fontSize: 12,
    color: '#666666',
    marginTop: -4,
  },
  labelSection: {
    flex: 1,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subcopy: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 18,
    marginBottom: 6,
  },
  confidence: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  breakdown: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#cccccc',
    width: 130,
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 18,
  },
})
