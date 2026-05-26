// ══════════════════════════════════════════════════════════════
// INTENT — System Rescue Entry Screen
// Outside-app rescue entry — under 2 taps to active mission
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { DeepLinkSource } from '../../types/deepLink'

interface RescueEntry {
  title: string
  exactAction: string
  duration: number
  source: DeepLinkSource
  reasoning: string
}

interface Props {
  entry: RescueEntry
  onStart: () => void
  onSmaller: () => void
  onNotThis: () => void
  onDismiss: () => void
}

export const SystemRescueEntryScreen: React.FC<Props> = ({
  entry,
  onStart,
  onSmaller,
  onNotThis,
  onDismiss,
}) => {
  const getTitle = () => {
    switch (entry.source) {
      case 'widget': return 'Rescue ready'
      case 'notification_action': return 'Tiny restart'
      case 'shortcut': return 'Shortcut rescue'
      case 'share_extension': return 'Mission from share'
      case 'app_intent': return 'Rescue ready'
      default: return 'Rescue ready'
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.source}>{getTitle()}</Text>
        <Text style={styles.duration}>{entry.duration}-minute rescue</Text>

        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>{entry.title}</Text>
          <Text style={styles.missionAction}>{entry.exactAction}</Text>
          <Text style={styles.reasoning}>{entry.reasoning}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onStart} activeOpacity={0.8}>
          <Text style={styles.primaryText}>Start</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onSmaller}>
            <Text style={styles.secondaryText}>Make smaller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onNotThis}>
            <Text style={styles.secondaryText}>Not this</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dismissLink} onPress={onDismiss}>
          <Text style={styles.dismissText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  source: {
    fontSize: 14,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  duration: {
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 24,
  },
  missionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 28,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  missionAction: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 12,
    lineHeight: 22,
  },
  reasoning: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#00ff88',
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  dismissLink: {
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    color: '#666666',
  },
})
