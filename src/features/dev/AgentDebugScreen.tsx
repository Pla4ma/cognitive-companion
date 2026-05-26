// ══════════════════════════════════════════════════════════════
// INTENT — Agent Debug Screen
// Inspect engine decisions during development
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

interface DebugData {
  lastAgentRun: {
    trigger: string
    selectedProtocol: string
    rejectedOptions: string[]
    qualityScore: number
    safetyDecision: string
    privacyDecision: string
    latencyMs: number
    usedRemoteAI: boolean
    steps: string[]
  } | null
  driftSignals: { state: string; risk: string; timestamp: number }[]
  toolProposals: { tool: string; risk: string; approved: boolean }[]
  timeToAction: { type: string; durationMs: number; target: number; meets: boolean }[]
}

interface Props {
  data: DebugData
}

export const AgentDebugScreen: React.FC<Props> = ({ data }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Agent Debug</Text>
      <Text style={styles.warning}>Development only — not visible in production</Text>

      {/* Last Agent Run */}
      {data.lastAgentRun && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Agent Run</Text>
          <View style={styles.card}>
            <Row label="Trigger" value={data.lastAgentRun.trigger} />
            <Row label="Protocol" value={data.lastAgentRun.selectedProtocol} />
            <Row label="Quality" value={`${data.lastAgentRun.qualityScore}/100`} />
            <Row label="Safety" value={data.lastAgentRun.safetyDecision} />
            <Row label="Privacy" value={data.lastAgentRun.privacyDecision} />
            <Row label="Latency" value={`${data.lastAgentRun.latencyMs}ms`} />
            <Row label="Remote AI" value={data.lastAgentRun.usedRemoteAI ? 'Yes' : 'No'} />

            <Text style={styles.subLabel}>Steps:</Text>
            {data.lastAgentRun.steps.map((step, i) => (
              <Text key={i} style={styles.stepText}>  {i + 1}. {step}</Text>
            ))}

            {data.lastAgentRun.rejectedOptions.length > 0 && (
              <>
                <Text style={styles.subLabel}>Rejected:</Text>
                {data.lastAgentRun.rejectedOptions.map((opt, i) => (
                  <Text key={i} style={styles.rejectedText}>  × {opt}</Text>
                ))}
              </>
            )}
          </View>
        </View>
      )}

      {/* Time to Action */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time to Action</Text>
        {data.timeToAction.map((t, i) => (
          <View key={i} style={styles.card}>
            <Row label={t.type} value={`${t.durationMs}ms`} />
            <Row label="Target" value={`${t.target}ms`} />
            <Row label="Meets" value={t.meets ? '✓ Yes' : '✗ No'} />
          </View>
        ))}
      </View>

      {/* Drift Signals */}
      {data.driftSignals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Drift Signals</Text>
          {data.driftSignals.map((s, i) => (
            <View key={i} style={styles.card}>
              <Row label="State" value={s.state} />
              <Row label="Risk" value={s.risk} />
            </View>
          ))}
        </View>
      )}

      {/* Tool Proposals */}
      {data.toolProposals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tool Proposals</Text>
          {data.toolProposals.map((t, i) => (
            <View key={i} style={styles.card}>
              <Row label="Tool" value={t.tool} />
              <Row label="Risk" value={t.risk} />
              <Row label="Approved" value={t.approved ? '✓' : '✗'} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  warning: {
    fontSize: 12,
    color: '#ff6666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00ff88',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#888888',
  },
  value: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 2,
  },
  rejectedText: {
    fontSize: 12,
    color: '#ff6666',
    marginBottom: 2,
  },
})
