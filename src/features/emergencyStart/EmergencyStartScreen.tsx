// ══════════════════════════════════════════════════════════════
// INTENT — Emergency Start Screen
// One giant button. Under 3 seconds to action.
// ══════════════════════════════════════════════════════════════

import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { getEmergencyStartMission, getEmergencyStartCopy, getEmergencyStartSubcopy } from '../../engine/emergencyStartEngine'

interface Props {
  onStart: (mission: { title: string; exactAction: string; duration: number }) => void
}

export const EmergencyStartScreen: React.FC<Props> = ({ onStart }) => {
  const handlePress = useCallback(() => {
    const result = getEmergencyStartMission()
    onStart({
      title: result.mission.title,
      exactAction: result.mission.exactAction,
      duration: result.mission.duration,
    })
  }, [onStart])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Stuck?</Text>
        <Text style={styles.subtitle}>No choices. No typing. Just start.</Text>

        <TouchableOpacity style={styles.bigButton} onPress={handlePress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{getEmergencyStartCopy()}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>2-minute mission. One tap.</Text>
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
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 48,
    textAlign: 'center',
  },
  bigButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  hint: {
    fontSize: 14,
    color: '#666666',
    marginTop: 32,
  },
})
