// ══════════════════════════════════════════════════════════════
// INTENT — Trust Center
// Privacy controls, consent management, data transparency
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { X, Shield, Eye, Database, Lock, Heart } from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography } from '../src/theme'
import { Screen, Card, SectionHeader } from '../src/components'
import type { PermissionId } from '../src/services/consent'

const PERMISSIONS: { id: PermissionId; label: string; description: string; icon: any }[] = [
  { id: 'crash_reporting', label: 'Crash Reports', description: 'Automatically send crash/bug reports to fix issues', icon: Shield },
  { id: 'data_sharing_anonymous', label: 'Anonymous Analytics', description: 'Share anonymized usage statistics to improve the app', icon: Eye },
  { id: 'notifications_smart', label: 'Smart Notifications', description: 'Rescue prompts, check-ins, and streak protection', icon: Heart },
  { id: 'ai_analysis', label: 'AI Personalization', description: 'Let AI learn from your patterns for better suggestions', icon: Lock },
]

export default function TrustCenterScreen() {
  const router = useRouter()
  const consentLedger = useAppStore((s) => s.consentLedger)
  const updateConsent = useAppStore((s) => s.updateConsent)
  const checkConsent = useAppStore((s) => s.checkConsent)

  return (
    <Screen gradient={['rgba(108,58,237,0.04)', 'transparent']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trust Center</Text>
          <Text style={styles.subtitle}>Your data. Your rules.</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Privacy Pledge */}
        <Card variant="glow" style={styles.pledgeCard}>
          <Shield size={28} color={colors.brand[500]} />
          <Text style={styles.pledgeTitle}>Privacy First</Text>
          <Text style={styles.pledgeText}>
            INTENT stores everything locally on your device. No data leaves without your explicit consent. 
            You can change these settings anytime.
          </Text>
        </Card>

        {/* Permissions */}
        <SectionHeader title="Permissions" />
        <Card variant="default" style={styles.permissionsCard}>
          {PERMISSIONS.map((perm) => {
            const Icon = perm.icon
            const granted = checkConsent(perm.id)
            return (
              <View key={perm.id} style={styles.permissionRow}>
                <View style={styles.permissionIcon}>
                  <Icon size={18} color={granted ? colors.accent.green : colors.text.tertiary} />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionLabel}>{perm.label}</Text>
                  <Text style={styles.permissionDesc}>{perm.description}</Text>
                </View>
                <Switch
                  value={granted}
                  onValueChange={(v) => updateConsent(perm.id, v, 'settings', `User toggled ${perm.id} to ${v}`)}
                  trackColor={{ false: colors.border.default, true: colors.brand[500] + '60' }}
                  thumbColor={granted ? colors.brand[500] : colors.border.strong}
                />
              </View>
            )
          })}
        </Card>

        {/* Data Rights */}
        <SectionHeader title="Your Rights" />
        <Card variant="default" style={styles.rightsCard}>
          <View style={styles.rightRow}>
            <Database size={18} color={colors.brand[400]} />
            <Text style={styles.rightText}>All data stored locally on device</Text>
          </View>
          <View style={styles.rightRow}>
            <Eye size={18} color={colors.brand[400]} />
            <Text style={styles.rightText}>No tracking, no profiling, no selling</Text>
          </View>
          <View style={styles.rightRow}>
            <Lock size={18} color={colors.brand[400]} />
            <Text style={styles.rightText}>Delete all data anytime from Settings</Text>
          </View>
        </Card>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  closeBtn: { padding: spacing.xs },
  title: { ...typography.headline, color: colors.text.primary },
  subtitle: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: 2 },
  pledgeCard: { padding: spacing.lg, alignItems: 'center', marginBottom: spacing.sectionGap },
  pledgeTitle: { ...typography.h3, color: colors.text.primary, marginTop: spacing.sm },
  pledgeText: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  permissionsCard: { padding: spacing.sm, marginBottom: spacing.sectionGap },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  permissionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.surface, justifyContent: 'center', alignItems: 'center' },
  permissionInfo: { flex: 1 },
  permissionLabel: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  permissionDesc: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
  rightsCard: { padding: spacing.md, marginBottom: spacing.sectionGap },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  rightText: { ...typography.bodySmall, color: colors.text.secondary, flex: 1 },
})
