// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Mode Onboarding
// 3-step opt-in flow for ambient agent mode
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

type Step = 0 | 1 | 2

const INTENSITY_OPTIONS = [
  {
    key: 'low' as const,
    label: 'Gentle',
    desc: '1–2 prompts per day. Only when drift risk is high.',
  },
  {
    key: 'balanced' as const,
    label: 'Balanced',
    desc: '2–4 prompts per day. Catches usual drift windows.',
  },
  {
    key: 'active' as const,
    label: 'Active',
    desc: '4–6 prompts per day. Maximum re-entry support.',
  },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function AmbientModeOnboarding(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const [step, setStep] = useState<Step>(0)
  const [intensity, setIntensity] = useState<'low' | 'balanced' | 'active'>('balanced')
  const [startHour, setStartHour] = useState(20)
  const [endHour, setEndHour] = useState(22)
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  )

  const toggleDay = (d: string) => {
    const next = new Set(selectedDays)
    if (next.has(d)) next.delete(d)
    else next.add(d)
    setSelectedDays(next)
  }

  const handleNext = () => {
    if (step < 2) setStep((step + 1) as Step)
    else {
      // Save settings to store
      navigation.goBack()
    }
  }

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepIcon}>🔔</Text>
      <Text style={styles.stepTitle}>Ambient Mode</Text>
      <Text style={styles.stepDescription}>
        INTENT can proactively suggest rescue moments based on your drift patterns.
      </Text>

      <View style={styles.infoCards}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardIcon}>🕐</Text>
          <Text style={styles.infoCardTitle}>It learns your windows</Text>
          <Text style={styles.infoCardDesc}>
            INTENT notices when you usually drift and offers a tiny action before it happens.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardIcon}>🔒</Text>
          <Text style={styles.infoCardTitle}>Privacy-first</Text>
          <Text style={styles.infoCardDesc}>
            Notifications never mention sensitive labels like "anxious" or "shame." Only you see the details.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardIcon}>✋</Text>
          <Text style={styles.infoCardTitle}>Always optional</Text>
          <Text style={styles.infoCardDesc}>
            Every prompt has "Not now." Ignoring prompts reduces frequency automatically.
          </Text>
        </View>
      </View>
    </View>
  )

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Danger Window</Text>
      <Text style={styles.stepDescription}>
        When do you usually drift? INTENT will offer a rescue during these times.
      </Text>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Start</Text>
          <Text style={styles.timeValue}>{startHour}:00</Text>
          <View style={styles.timeButtons}>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setStartHour(Math.max(0, startHour - 1))}
            >
              <Text style={styles.timeBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setStartHour(Math.min(23, startHour + 1))}
            >
              <Text style={styles.timeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.timeArrow}>→</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>End</Text>
          <Text style={styles.timeValue}>{endHour}:00</Text>
          <View style={styles.timeButtons}>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setEndHour(Math.max(0, endHour - 1))}
            >
              <Text style={styles.timeBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setEndHour(Math.min(23, endHour + 1))}
            >
              <Text style={styles.timeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.daysLabel}>Days</Text>
      <View style={styles.daysRow}>
        {DAYS.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.dayChip, selectedDays.has(d) && styles.dayChipActive]}
            onPress={() => toggleDay(d)}
          >
            <Text style={[styles.dayText, selectedDays.has(d) && styles.dayTextActive]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How Active?</Text>
      <Text style={styles.stepDescription}>
        Choose how often INTENT should check in.
      </Text>

      <View style={styles.intensityList}>
        {INTENSITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.intensityCard,
              intensity === opt.key && styles.intensityCardActive,
            ]}
            onPress={() => setIntensity(opt.key)}
          >
            <View style={styles.intensityRadio}>
              {intensity === opt.key && <View style={styles.intensityRadioInner} />}
            </View>
            <View style={styles.intensityInfo}>
              <Text style={styles.intensityLabel}>{opt.label}</Text>
              <Text style={styles.intensityDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sensitiveRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sensitiveLabel}>Sensitive notifications</Text>
          <Text style={styles.sensitiveDesc}>
            OFF = vague copy only. Never mentions state labels in notifications.
          </Text>
        </View>
        <Switch value={false} disabled trackColor={{ false: '#333', true: '#00ff88' }} />
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.stepDot, i === step && styles.stepDotActive]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {step === 2 ? 'Enable Ambient Mode' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  cancelText: { fontSize: 16, color: '#888', width: 60 },
  stepIndicator: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  stepDotActive: { backgroundColor: '#00ff88', width: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  stepContent: { paddingTop: 20 },
  stepIcon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  infoCards: { gap: 12 },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoCardIcon: { fontSize: 24, marginBottom: 8 },
  infoCardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  infoCardDesc: { fontSize: 13, color: '#888', lineHeight: 20 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  timeBlock: { alignItems: 'center' },
  timeLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  timeValue: { fontSize: 36, fontWeight: '800', color: '#fff' },
  timeButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeBtnText: { fontSize: 18, color: '#00ff88', fontWeight: '700' },
  timeArrow: { fontSize: 24, color: '#555', marginTop: 20 },
  daysLabel: { fontSize: 14, color: '#888', marginBottom: 10, textAlign: 'center' },
  daysRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dayChipActive: { backgroundColor: '#00ff8820', borderColor: '#00ff88' },
  dayText: { fontSize: 13, color: '#888', fontWeight: '600' },
  dayTextActive: { color: '#00ff88' },
  intensityList: { gap: 12, marginBottom: 20 },
  intensityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  intensityCardActive: { borderColor: '#00ff88', backgroundColor: '#00ff8810' },
  intensityRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  intensityRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
  },
  intensityInfo: { flex: 1 },
  intensityLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  intensityDesc: { fontSize: 13, color: '#888', marginTop: 2, lineHeight: 19 },
  sensitiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sensitiveLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  sensitiveDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  nextButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: { fontSize: 17, fontWeight: '700', color: '#0a0a0a' },
})
