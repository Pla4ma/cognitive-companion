// ══════════════════════════════════════════════════════════════
// INTENT — Open Loops Screen
// Attention hooks — close with tiny actions, not guilt
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import type { OpenLoop } from '../../types/openLoop'
import { getOpenLoopCopy, getOpenLoopsHeader, getOpenLoopReliefCopy } from '../../engine/openLoopEngine'

interface Props {
  loops: OpenLoop[]
  onStartAction: (loop: OpenLoop) => void
  onDismiss: (loop: OpenLoop) => void
  onRelieve: (loop: OpenLoop) => void
}

export const OpenLoopsScreen: React.FC<Props> = ({ loops, onStartAction, onDismiss, onRelieve }) => {
  const openLoops = loops.filter((l) => l.status === 'open')
  const inProgress = loops.filter((l) => l.status === 'in_progress')

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Open Loops</Text>
      <Text style={styles.header}>{getOpenLoopsHeader(openLoops.length)}</Text>
      <Text style={styles.subtitle}>
        Open loops are not failures. They are attention hooks. Close one with a tiny action.
      </Text>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In progress</Text>
          {inProgress.map((loop) => (
            <View key={loop.id} style={[styles.card, styles.activeCard]}>
              <Text style={styles.cardTitle}>{loop.title}</Text>
              <Text style={styles.cardAction}>{loop.nextTinyAction}</Text>
              <TouchableOpacity style={styles.relieveButton} onPress={() => onRelieve(loop)}>
                <Text style={styles.relieveText}>Mark relieved</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Open Loops */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pulling your attention</Text>
        {openLoops.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No open loops. You are clear.</Text>
          </View>
        ) : (
          openLoops.map((loop) => (
            <View key={loop.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{loop.title}</Text>
                <Text style={styles.weight}>
                  {loop.emotionalWeight >= 4 ? '🔴' : loop.emotionalWeight >= 2 ? '🟡' : '⚪'}
                </Text>
              </View>
              <Text style={styles.cardCopy}>{getOpenLoopCopy(loop)}</Text>
              <Text style={styles.cardAction}>{loop.nextTinyAction}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.startButton} onPress={() => onStartAction(loop)}>
                  <Text style={styles.startText}>Start tiny action</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissButton} onPress={() => onDismiss(loop)}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  header: {
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  activeCard: {
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  weight: {
    fontSize: 12,
  },
  cardCopy: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  cardAction: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dismissText: {
    fontSize: 14,
    color: '#666666',
  },
  relieveButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  relieveText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
  },
})
