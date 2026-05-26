// ══════════════════════════════════════════════════════════════
// INTENT — Attention Receipt Share
// Share-safe version — hides private text
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native'
import type { AttentionReceipt } from '../../engine/attentionReceiptEngine'

interface Props {
  receipt: AttentionReceipt
  onDone: () => void
}

export const AttentionReceiptShare: React.FC<Props> = ({ receipt, onDone }) => {
  const shareText = `${receipt.shareableVersion}\n\n— via INTENT`

  const handleShare = async () => {
    try {
      await Share.share({ message: shareText })
    } catch {
      // User cancelled or error
    }
  }

  const handleCopy = async () => {
    try {
      const Clipboard = require('expo-clipboard')
      await Clipboard.setStringAsync(shareText)
    } catch {
      // Fallback: clipboard not available
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Receipt</Text>
      <Text style={styles.subtitle}>Privacy-safe version. No sensitive details.</Text>

      {/* Preview Card */}
      <View style={styles.previewCard}>
        <Text style={styles.previewHeader}>ATTENTION RECEIPT</Text>
        <Text style={styles.previewText}>{receipt.shareableVersion}</Text>
        <Text style={styles.previewTime}>{receipt.duration} minutes</Text>
        <Text style={styles.previewFooter}>via INTENT</Text>
      </View>

      {/* What's Hidden */}
      <View style={styles.hiddenInfo}>
        <Text style={styles.hiddenLabel}>Hidden in share version:</Text>
        <Text style={styles.hiddenItem}>• Mission text</Text>
        <Text style={styles.hiddenItem}>• State labels</Text>
        <Text style={styles.hiddenItem}>• Specific task details</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888888', marginBottom: 28, textAlign: 'center' },
  previewCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#2a2a2a' },
  previewHeader: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 2, marginBottom: 12 },
  previewText: { fontSize: 16, color: '#ffffff', lineHeight: 22, marginBottom: 10 },
  previewTime: { fontSize: 13, color: '#00ff88', marginBottom: 10 },
  previewFooter: { fontSize: 11, color: '#555555' },
  hiddenInfo: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 24 },
  hiddenLabel: { fontSize: 12, color: '#888888', marginBottom: 6 },
  hiddenItem: { fontSize: 12, color: '#666666', marginLeft: 8, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shareButton: { flex: 1, backgroundColor: '#00ff88', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  shareText: { fontSize: 16, fontWeight: '700', color: '#000000' },
  copyButton: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  copyText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  doneButton: { alignItems: 'center', paddingVertical: 12 },
  doneText: { fontSize: 14, color: '#666666' },
})
