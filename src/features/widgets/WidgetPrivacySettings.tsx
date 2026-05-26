// ══════════════════════════════════════════════════════════════
// INTENT — Widget Privacy Settings
// Controls what widgets show on lock/home screens
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import type { WidgetPrivacyMode, WidgetPrivacySettings as Settings } from '../../services/widgets/widgetPrivacy'
import { getWidgetPrivacyDescription } from '../../services/widgets/widgetPrivacy'

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

interface ModeCardInfo {
  mode: WidgetPrivacyMode
  title: string
  preview: string
  icon: string
}

const MODE_CARDS: ModeCardInfo[] = [
  {
    mode: 'private',
    title: 'Private',
    preview: 'Rescue ready',
    icon: '🔒',
  },
  {
    mode: 'standard',
    title: 'Standard',
    preview: '5-min study rescue',
    icon: '📋',
  },
  {
    mode: 'detailed',
    title: 'Detailed',
    preview: 'Open essay doc → write one sentence',
    icon: '📝',
  },
]

export const WidgetPrivacySettings: React.FC<Props> = ({ settings, onChange }) => {
  const [detailedConfirmed, setDetailedConfirmed] = useState(false)

  const handleModeSelect = (mode: WidgetPrivacyMode) => {
    if (mode === 'detailed' && !detailedConfirmed) {
      // Require explicit opt-in for detailed mode
      return
    }
    onChange({ ...settings, mode })
  }

  const handleConfirmDetailed = () => {
    setDetailedConfirmed(true)
    onChange({ ...settings, mode: 'detailed' })
  }

  const handleLockScreenToggle = (value: boolean) => {
    onChange({ ...settings, hideOnLockScreen: value })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Widget Privacy</Text>
      <Text style={styles.subtitle}>
        Control what appears on your home and lock screens
      </Text>

      {/* Mode cards */}
      {MODE_CARDS.map((card) => {
        const isSelected = settings.mode === card.mode
        const isDetailedLocked = card.mode === 'detailed' && !detailedConfirmed

        return (
          <TouchableOpacity
            key={card.mode}
            style={[styles.modeCard, isSelected && styles.modeCardSelected]}
            onPress={() => handleModeSelect(card.mode)}
            activeOpacity={card.mode === 'detailed' && !detailedConfirmed ? 1 : 0.7}
          >
            <View style={styles.modeHeader}>
              <Text style={styles.modeIcon}>{card.icon}</Text>
              <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>
                {card.title}
              </Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <Text style={styles.modeDescription}>
              {getWidgetPrivacyDescription(card.mode)}
            </Text>

            {/* Widget preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Widget shows:</Text>
              <Text style={styles.previewText}>{card.preview}</Text>
            </View>

            {/* Detailed mode requires explicit opt-in */}
            {card.mode === 'detailed' && isDetailedLocked && (
              <TouchableOpacity style={styles.optInButton} onPress={handleConfirmDetailed}>
                <Text style={styles.optInText}>I understand — enable detailed</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )
      })}

      {/* Lock screen toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>Hide on lock screen</Text>
          <Text style={styles.toggleDescription}>
            Show generic text only when device is locked
          </Text>
        </View>
        <Switch
          value={settings.hideOnLockScreen}
          onValueChange={handleLockScreenToggle}
          trackColor={{ false: '#333', true: '#1a4a2a' }}
          thumbColor={settings.hideOnLockScreen ? '#00ff88' : '#888'}
        />
      </View>

      {/* Always-on note */}
      <View style={styles.noteBox}>
        <Text style={styles.noteIcon}>🛡️</Text>
        <Text style={styles.noteText}>
          Sensitive missions (anxiety, shame, doomscroll) are always hidden from widgets,
          regardless of mode.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    lineHeight: 20,
  },
  modeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modeCardSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#1a2a1a',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  modeTitleSelected: {
    color: '#00ff88',
  },
  checkmark: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: '700',
  },
  modeDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 10,
  },
  previewLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  optInButton: {
    marginTop: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  optInText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#888',
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'flex-start',
  },
  noteIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  noteText: {
    fontSize: 13,
    color: '#8888cc',
    flex: 1,
    lineHeight: 18,
  },
})
