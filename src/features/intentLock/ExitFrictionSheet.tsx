// ══════════════════════════════════════════════════════════════
// INTENT — Exit Friction Sheet
// Supportive bottom sheet when user tries to exit a mission
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import type { ExitFrictionOption } from '../../engine/intentLockEngine'
import { getExitOptionLabel } from '../../engine/intentLockEngine'

interface Props {
  visible: boolean
  missionTitle: string
  onSelect: (option: ExitFrictionOption) => void
  onCancel: () => void
}

interface OptionConfig {
  key: ExitFrictionOption
  icon: string
  description: string
  color: string
}

const OPTIONS: OptionConfig[] = [
  {
    key: 'make_smaller',
    icon: '🔬',
    description: 'Shrink the mission to something even easier',
    color: '#00ff88',
  },
  {
    key: 'capture_distraction',
    icon: '📝',
    description: 'Write down what pulled you away, then decide',
    color: '#3B82F6',
  },
  {
    key: 'salvage',
    icon: '♻️',
    description: 'Mark what you did as progress. No wasted effort.',
    color: '#F59E0B',
  },
  {
    key: 'end_session',
    icon: '🚪',
    description: 'End this session. You can always come back.',
    color: '#EF4444',
  },
]

export const ExitFrictionSheet: React.FC<Props> = ({
  visible,
  missionTitle,
  onSelect,
  onCancel,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.handle} />
          <Text style={styles.title}>Want the smaller version?</Text>
          <Text style={styles.subtitle}>
            No shame. You started, and that matters. Here are your options.
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.optionRow}
                onPress={() => onSelect(opt.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: opt.color + '18' }]}>
                  <Text style={styles.icon}>{opt.icon}</Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{getExitOptionLabel(opt.key)}</Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Keep going</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginBottom: 24,
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
})
