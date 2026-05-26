// ══════════════════════════════════════════════════════════════
// INTENT — Personal Playbook Screen
// Your anti-drift playbook — learns what works for you
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import type { PersonalPlaybook, PlaybookRule } from '../../engine/playbookEngine'
import { getPlaybookSummary } from '../../engine/playbookEngine'

interface Props {
  playbook: PersonalPlaybook
  onRulePress: (rule: PlaybookRule) => void
}

export const PersonalPlaybookScreen: React.FC<Props> = ({ playbook, onRulePress }) => {
  const summary = getPlaybookSummary(playbook)
  const learned = playbook.rules.filter((r) => r.source === 'learned' && r.confidence >= 0.6)
  const learning = playbook.rules.filter((r) => r.confidence < 0.6)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Your Anti-Drift Playbook</Text>
      <Text style={styles.subtitle}>
        {playbook.isLearning ? 'Learning your patterns...' : `${playbook.totalMissions} missions analyzed`}
      </Text>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What works for you</Text>
        {summary.map((s, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.summaryText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Learned Rules */}
      {learned.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirmed patterns</Text>
          {learned.map((rule) => (
            <TouchableOpacity
              key={rule.id}
              style={styles.ruleCard}
              onPress={() => onRulePress(rule)}
            >
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleState}>{rule.state}</Text>
                <Text style={styles.ruleConfidence}>{Math.round(rule.confidence * 100)}%</Text>
              </View>
              <Text style={styles.ruleText}>{rule.rule}</Text>
              <Text style={styles.ruleEvidence}>{rule.evidence} data points</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Learning Rules */}
      {learning.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Still learning</Text>
          {learning.map((rule) => (
            <View key={rule.id} style={styles.learningCard}>
              <Text style={styles.learningText}>{rule.rule}</Text>
              <Text style={styles.learningEvidence}>{rule.evidence} data points</Text>
            </View>
          ))}
        </View>
      )}

      {/* Starter Rules */}
      {playbook.isLearning && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Starter patterns</Text>
          <Text style={styles.learningHint}>
            These are general best practices. They will personalize as you use INTENT.
          </Text>
        </View>
      )}
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
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00ff88',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#00ff88',
    marginRight: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#ffffff',
    flex: 1,
  },
  ruleCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ruleState: {
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
  },
  ruleConfidence: {
    fontSize: 12,
    color: '#00ff88',
    fontWeight: '700',
  },
  ruleText: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 4,
  },
  ruleEvidence: {
    fontSize: 12,
    color: '#666666',
  },
  learningCard: {
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  learningText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  learningEvidence: {
    fontSize: 11,
    color: '#555555',
  },
  learningHint: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
})
