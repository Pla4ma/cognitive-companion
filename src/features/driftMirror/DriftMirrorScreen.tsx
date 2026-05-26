// ══════════════════════════════════════════════════════════════
// INTENT — Drift Mirror Screen
// "The moment you almost lost and what saved it"
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native'
import type { DriftMirrorInsight } from '../../engine/driftMirror'
import { getMirrorTitle, getMirrorSubcopy, getMirrorAcceptanceCopy } from '../../engine/driftMirror'

interface Props {
  insight: DriftMirrorInsight
  onAccept: () => void
  onReject: () => void
  onDismiss: () => void
}

export const DriftMirrorScreen: React.FC<Props> = ({ insight, onAccept, onReject, onDismiss }) => {
  const handleShare = async () => {
    try {
      await Share.share({ message: insight.shareSafeVersion })
    } catch {
      // cancelled
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{getMirrorTitle()}</Text>
        <Text style={styles.subtitle}>{getMirrorSubcopy()}</Text>

        <View style={styles.insightBox}>
          <Text style={styles.situation}>{insight.situation}</Text>
          <Text style={styles.savedLabel}>What saved it:</Text>
          <Text style={styles.savedValue}>{insight.whatSavedIt}</Text>
        </View>

        <View style={styles.ruleBox}>
          <Text style={styles.ruleLabel}>New rule:</Text>
          <Text style={styles.ruleText}>{insight.newRule}</Text>
          <Text style={styles.confidence}>
            Confidence: {Math.round(insight.confidence * 100)}%
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptText}>Add to playbook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Text style={styles.rejectText}>Not useful</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareLink} onPress={handleShare}>
          <Text style={styles.shareText}>Share insight</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissLink} onPress={onDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
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
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  insightBox: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  situation: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
  },
  savedLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  savedValue: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: '600',
  },
  ruleBox: {
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ruleLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 12,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  shareLink: {
    alignItems: 'center',
    marginBottom: 8,
  },
  shareText: {
    fontSize: 14,
    color: '#00ff88',
  },
  dismissLink: {
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: '#666666',
  },
})
