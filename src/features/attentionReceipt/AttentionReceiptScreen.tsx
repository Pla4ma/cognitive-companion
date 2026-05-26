// ══════════════════════════════════════════════════════════════
// INTENT — Attention Receipt Screen
// "What did I do with the moment I almost lost?"
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native'
import type { AttentionReceipt } from '../../types/attentionReceipt'
import { getReceiptTitle, getReceiptEmoji, getReceiptNextCopy } from '../../engine/attentionReceiptEngine'

interface Props {
  receipt: AttentionReceipt
  onDismiss: () => void
}

export const AttentionReceiptScreen: React.FC<Props> = ({ receipt, onDismiss }) => {
  const handleShare = async () => {
    try {
      await Share.share({ message: receipt.shareableVersion })
    } catch {
      // User cancelled
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{getReceiptEmoji(receipt.outcome)}</Text>
        <Text style={styles.title}>{getReceiptTitle(receipt.outcome)}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Before</Text>
          <Text style={styles.value}>{receipt.beforeState}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Action</Text>
          <Text style={styles.value}>{receipt.missionAction}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{receipt.duration} min</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.nextCopy}>{getReceiptNextCopy(receipt)}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Done</Text>
          </TouchableOpacity>
        </View>
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
    maxWidth: 360,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#888888',
  },
  value: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 16,
  },
  nextCopy: {
    fontSize: 15,
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})
