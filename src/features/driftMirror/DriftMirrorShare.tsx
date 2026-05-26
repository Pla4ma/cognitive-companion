// ══════════════════════════════════════════════════════════════
// INTENT — Drift Mirror Share Card
// Privacy-safe shareable insight card
// ══════════════════════════════════════════════════════════════

import React, { useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Sharing from 'expo-sharing'
import * as Clipboard from 'expo-clipboard'
import ViewShot from 'react-native-view-shot'
import type { DriftMirrorInsight } from '../../engine/driftMirror'

interface Props {
  insight: DriftMirrorInsight
  onClose: () => void
}

function sanitizeForShare(insight: DriftMirrorInsight): {
  beforeGeneric: string
  action: string
  result: string
  shareText: string
} {
  // Remove sensitive state labels — use generic language
  const stateMap: Record<string, string> = {
    overwhelmed: 'stuck',
    stuck: 'having a hard moment',
    avoiding: 'resisting',
    tired: 'low energy',
    anxious: 'tense',
    doomscroll_risk: 'about to lose time',
    perfectionism: 'overthinking',
    scattered: 'unfocused',
    shame_spiral: 'in a tough spot',
    ready: 'ready to go',
  }
  const beforeGeneric = stateMap[insight.beforeState] ?? 'in a tough moment'
  const action = 'A tiny action broke the pattern'
  const result = insight.confidence > 0.5 ? 'It worked.' : 'I tried. That counts.'

  const shareText = [
    `Before: ${beforeGeneric}`,
    `What I did: ${action}`,
    result,
    '',
    '— shared from INTENT',
  ].join('\n')

  return { beforeGeneric, action, result, shareText }
}

export const DriftMirrorShare: React.FC<Props> = ({ insight, onClose }) => {
  const viewShotRef = useRef<ViewShot>(null)
  const { beforeGeneric, action, result, shareText } = sanitizeForShare(insight)

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shareText)
    Alert.alert('Copied', 'Insight copied to clipboard.')
  }

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        // Capture card as image if viewshot ref is available
        if (viewShotRef.current?.capture) {
          const uri = await viewShotRef.current.capture()
          await Sharing.shareAsync(uri, { mimeType: 'image/png' })
        } else {
          await Sharing.shareAsync(shareText)
        }
      } else {
        await Clipboard.setStringAsync(shareText)
        Alert.alert('Copied', 'Sharing not available. Copied to clipboard instead.')
      }
    } catch {
      // user cancelled
    }
  }

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <LinearGradient
          colors={['#0a1628', '#162240', '#0a1628']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.brand}>INTENT</Text>
          <Text style={styles.cardTitle}>Pattern Insight</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Before</Text>
            <Text style={styles.sectionValue}>{beforeGeneric}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What I did</Text>
            <Text style={styles.sectionValue}>{action}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Result</Text>
            <Text style={[styles.sectionValue, result === 'It worked.' && styles.successText]}>
              {result}
            </Text>
          </View>

          <Text style={styles.footer}>
            No personal details shared
          </Text>
        </LinearGradient>
      </ViewShot>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyText}>Copy Text</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeLink} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
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
    paddingVertical: 32,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  brand: {
    fontSize: 11,
    color: '#00ff88',
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 22,
  },
  successText: {
    color: '#00ff88',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },
  footer: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 24,
    width: '100%',
    maxWidth: 340,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  copyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  closeLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 14,
    color: '#666',
  },
})
