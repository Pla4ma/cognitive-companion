// ══════════════════════════════════════════════════════════════
// INTENT — Intentional Scroll Choice Screen
// Make the scroll a choice, not a slip
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  onTinyWin: () => void
  onIntentionalScroll: (minutes: number) => void
  onSwapScroll: (action: string) => void
  onDone: () => void
}

const SWAP_OPTIONS = [
  { action: 'Stretch for 2 minutes', emoji: '🧘' },
  { action: 'Fill a glass of water', emoji: '💧' },
  { action: 'Clear one surface', emoji: '🧹' },
  { action: 'Open your notes', emoji: '📓' },
  { action: 'Stand outside for 2 minutes', emoji: '🌿' },
  { action: 'Put 5 things away', emoji: '📦' },
]

export const IntentionalScrollChoiceScreen: React.FC<Props> = ({ onTinyWin, onIntentionalScroll, onSwapScroll, onDone }) => {
  const [showTimer, setShowTimer] = useState(false)
  const [showSwaps, setShowSwaps] = useState(false)

  if (showTimer) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scroll with timer</Text>
        <Text style={styles.subtitle}>Set a boundary. Timer keeps it honest.</Text>
        {[5, 10, 15, 20].map((min) => (
          <TouchableOpacity key={min} style={styles.timerOption} onPress={() => onIntentionalScroll(min)}>
            <Text style={styles.timerText}>{min} minutes</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backLink} onPress={() => setShowTimer(false)}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (showSwaps) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Swap the scroll</Text>
        <Text style={styles.subtitle}>Low-energy alternatives. Pick one.</Text>
        {SWAP_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.action} style={styles.swapOption} onPress={() => onSwapScroll(opt.action)}>
            <Text style={styles.swapEmoji}>{opt.emoji}</Text>
            <Text style={styles.swapText}>{opt.action}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backLink} onPress={() => setShowSwaps(false)}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Before you scroll</Text>
      <Text style={styles.subtitle}>Make it a choice, not a slip.</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onTinyWin}>
        <Text style={styles.primaryEmoji}>🏆</Text>
        <View style={styles.optionContent}>
          <Text style={styles.primaryText}>Tiny Win First</Text>
          <Text style={styles.optionDesc}>2-minute action, then choose freely</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowTimer(true)}>
        <Text style={styles.secondaryEmoji}>⏱️</Text>
        <View style={styles.optionContent}>
          <Text style={styles.secondaryText}>Scroll With Timer</Text>
          <Text style={styles.optionDesc}>Set a boundary before you start</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowSwaps(true)}>
        <Text style={styles.secondaryEmoji}>🔄</Text>
        <View style={styles.optionContent}>
          <Text style={styles.secondaryText}>Swap the Scroll</Text>
          <Text style={styles.optionDesc}>Low-energy alternative</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneText}>I'm done with my phone</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888888', marginBottom: 32, textAlign: 'center' },
  primaryButton: { backgroundColor: '#1a2a1a', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#00ff88' },
  primaryEmoji: { fontSize: 28, marginRight: 16 },
  primaryText: { fontSize: 18, fontWeight: '700', color: '#00ff88' },
  secondaryButton: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  secondaryEmoji: { fontSize: 24, marginRight: 14 },
  secondaryText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  optionContent: { flex: 1 },
  optionDesc: { fontSize: 13, color: '#888888', marginTop: 2 },
  doneButton: { marginTop: 20, alignItems: 'center', paddingVertical: 14 },
  doneText: { fontSize: 15, color: '#666666', textDecorationLine: 'underline' },
  timerOption: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, alignItems: 'center' },
  timerText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  swapOption: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  swapEmoji: { fontSize: 24, marginRight: 14 },
  swapText: { fontSize: 15, color: '#ffffff' },
  backLink: { marginTop: 16, alignItems: 'center' },
  backText: { fontSize: 14, color: '#666666' },
})
