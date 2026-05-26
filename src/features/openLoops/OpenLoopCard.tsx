// ══════════════════════════════════════════════════════════════
// INTENT — Open Loop Card
// Card for a single open loop with emotional weight indicator
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { OpenLoop, OpenLoopStatus } from '../../types/openLoop'
import { getOpenLoopCopy } from '../../engine/openLoopEngine'

interface Props {
  loop: OpenLoop
  onStartAction: (loop: OpenLoop) => void
  onDismiss: (loop: OpenLoop) => void
  onRelieve: (loop: OpenLoop) => void
}

function getWeightColor(weight: number): string {
  if (weight >= 4) return '#EF4444'
  if (weight >= 3) return '#F59E0B'
  return '#10B981'
}

function getWeightLabel(weight: number): string {
  if (weight >= 4) return 'High'
  if (weight >= 3) return 'Medium'
  return 'Low'
}

function getStatusConfig(status: OpenLoopStatus): { label: string; color: string; bg: string } {
  switch (status) {
    case 'open': return { label: 'Open', color: '#F59E0B', bg: '#F59E0B18' }
    case 'in_progress': return { label: 'In progress', color: '#3B82F6', bg: '#3B82F618' }
    case 'relieved': return { label: 'Relieved', color: '#10B981', bg: '#10B98118' }
    case 'dismissed': return { label: 'Dismissed', color: '#6B7280', bg: '#6B728018' }
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const OpenLoopCard: React.FC<Props> = ({ loop, onStartAction, onDismiss, onRelieve }) => {
  const [expanded, setExpanded] = useState(false)
  const weightColor = getWeightColor(loop.emotionalWeight)
  const statusConfig = getStatusConfig(loop.status)

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: weightColor }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{loop.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <View style={[styles.weightDot, { backgroundColor: weightColor }]} />
        <Text style={[styles.weightText, { color: weightColor }]}>
          {getWeightLabel(loop.emotionalWeight)} weight
        </Text>
        <Text style={styles.timeText}>{formatRelativeTime(loop.lastTouchedAt)}</Text>
      </View>

      <Text style={styles.tinyAction} numberOfLines={expanded ? 3 : 1}>
        → {loop.nextTinyAction}
      </Text>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.copyText}>{getOpenLoopCopy(loop)}</Text>
          <Text style={styles.sourceText}>Source: {loop.source.replace(/_/g, ' ')}</Text>

          {loop.status === 'open' || loop.status === 'in_progress' ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => onStartAction(loop)}
              >
                <Text style={styles.startText}>Start tiny action</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.relieveButton}
                onPress={() => onRelieve(loop)}
              >
                <Text style={styles.relieveText}>Relieve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => onDismiss(loop)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
  tinyAction: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '500',
  },
  details: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 12,
  },
  copyText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  relieveButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  relieveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dismissText: {
    fontSize: 13,
    color: '#666666',
  },
})
