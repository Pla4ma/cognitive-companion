// ══════════════════════════════════════════════════════════════
// INTENT — Demo Mode Toggle
// Developer-only toggle for seeded demo data
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import {
  isDemoMode,
  enableDemoMode,
  disableDemoMode,
  getDemoModeWarning,
} from '../../services/demo/demoData'

interface Props {
  onModeChange?: (isDemo: boolean) => void
}

export const DemoModeToggle: React.FC<Props> = ({ onModeChange }) => {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(isDemoMode())
  }, [])

  const handleToggle = () => {
    if (enabled) {
      // Turning off
      disableDemoMode()
      setEnabled(false)
      onModeChange?.(false)
    } else {
      // Turning on — show warning first
      Alert.alert(
        'Enable Demo Mode?',
        'Demo mode uses fake data: sample missions, drift insights, weekly stories, and before-scroll examples.\n\nToggle off before using with real data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            style: 'destructive',
            onPress: () => {
              enableDemoMode()
              setEnabled(true)
              onModeChange?.(true)
            },
          },
        ],
      )
    }
  }

  // Only visible in dev builds
  if (!__DEV__) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Demo Mode</Text>
        <View style={[styles.badge, enabled ? styles.badgeDemo : styles.badgeLive]}>
          <Text style={[styles.badgeText, enabled ? styles.badgeTextDemo : styles.badgeTextLive]}>
            {enabled ? 'DEMO' : 'LIVE'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.toggleButton, enabled ? styles.toggleOn : styles.toggleOff]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.knob, enabled ? styles.knobRight : styles.knobLeft]} />
      </TouchableOpacity>

      {enabled && (
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>{getDemoModeWarning()}</Text>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.detailLabel}>Demo includes:</Text>
        <Text style={styles.detailItem}>• Sample missions (essay, exam, cleaning)</Text>
        <Text style={styles.detailItem}>• Drift insights with seeded patterns</Text>
        <Text style={styles.detailItem}>• Weekly story with demo timeline</Text>
        <Text style={styles.detailItem}>• Before-scroll examples</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeLive: {
    backgroundColor: '#1a2a1a',
  },
  badgeDemo: {
    backgroundColor: '#3a2a1a',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgeTextLive: {
    color: '#00ff88',
  },
  badgeTextDemo: {
    color: '#FFB347',
  },
  toggleButton: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  toggleOn: {
    backgroundColor: '#3a2a1a',
  },
  toggleOff: {
    backgroundColor: '#2a2a2a',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  knobLeft: {
    alignSelf: 'flex-start',
  },
  knobRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFB347',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#2a2a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#3a3a1a',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  warningText: {
    fontSize: 13,
    color: '#FFB347',
    flex: 1,
    lineHeight: 18,
  },
  details: {
    paddingTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  detailItem: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
})
