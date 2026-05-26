// ══════════════════════════════════════════════════════════════
// INTENT — Context Sensitivity Badge
// Visual indicator for context privacy level
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { ContextSensitivity } from '../../src/types/contextCapsule'

interface ContextSensitivityBadgeProps {
  sensitivity: ContextSensitivity
  compact?: boolean
}

const SENSITIVITY_CONFIG: Record<ContextSensitivity, { label: string; color: string; bg: string; emoji: string }> = {
  public: { label: 'Public', color: '#10B981', bg: '#10B98122', emoji: '🟢' },
  personal: { label: 'Personal', color: '#3B82F6', bg: '#3B82F622', emoji: '🔵' },
  sensitive: { label: 'Sensitive', color: '#F59E0B', bg: '#F59E0B22', emoji: '🟡' },
  restricted: { label: 'Restricted', color: '#EF4444', bg: '#EF444422', emoji: '🔴' },
}

export function ContextSensitivityBadge({ sensitivity, compact = false }: ContextSensitivityBadgeProps) {
  const config = SENSITIVITY_CONFIG[sensitivity]

  if (compact) {
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.emoji}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.emoji} {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
})
