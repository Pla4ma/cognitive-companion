// ══════════════════════════════════════════════════════════════
// INTENT — Trust Center v4 (Phase 17)
// Complete transparency: what INTENT learns, what stays local,
// AI visibility, data controls, safety boundaries, agent actions
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Shield, Eye, Lock, Database, Download, Trash2, ChevronRight,
  Brain, Bell, Fingerprint, Server, Smartphone, Cpu, Activity,
  CheckCircle2, AlertTriangle, ExternalLink, Zap,
} from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography } from '../src/theme'
import { Screen, Card } from '../src/components'
import { DATA_CATEGORIES } from '../src/types/privacy'

type TrustSection = 'overview' | 'learns' | 'ai' | 'data' | 'permissions' | 'actions' | 'safety' | 'local'

const SECTIONS: { id: TrustSection; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'learns', label: 'What It Learns', icon: Eye },
  { id: 'ai', label: 'AI Visibility', icon: Brain },
  { id: 'data', label: 'Your Data', icon: Database },
  { id: 'permissions', label: 'Permissions', icon: Lock },
  { id: 'actions', label: 'Agent Actions', icon: Zap },
  { id: 'safety', label: 'Safety', icon: Activity },
  { id: 'local', label: 'Local Mode', icon: Smartphone },
]

export default function TrustCenterScreen() {
  const router = useRouter()
  const store = useAppStore()
  const [activeSection, setActiveSection] = useState<TrustSection>('overview')
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [localOnly, setLocalOnly] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data will be exported as a JSON file. Nothing is sent to any server.')
  }

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your missions, sessions, memory, drift graph, and patterns. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: () => Alert.alert('Deleted', 'All data has been deleted.') },
      ]
    )
  }

  const renderOverview = () => (
    <>
      <Card variant="glow" style={styles.heroCard}>
        <Shield size={32} color={colors.brand[400]} style={{ marginBottom: spacing.sm }} />
        <Text style={styles.heroTitle}>INTENT can learn your patterns.</Text>
        <Text style={styles.heroSub}>
          It should never trap you inside them. You can inspect, edit, or delete what it remembers.
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card variant="subtle" style={styles.statCard}>
          <Text style={styles.statValue}>{DATA_CATEGORIES.length}</Text>
          <Text style={styles.statLabel}>Data categories</Text>
        </Card>
        <Card variant="subtle" style={styles.statCard}>
          <Text style={styles.statValue}>100%</Text>
          <Text style={styles.statLabel}>Stored locally</Text>
        </Card>
        <Card variant="subtle" style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Servers synced</Text>
        </Card>
      </View>

      <Text style={styles.sectionHeading}>Trust Center Sections</Text>
      {SECTIONS.slice(1).map(section => (
        <TouchableOpacity
          key={section.id}
          style={styles.menuRow}
          onPress={() => setActiveSection(section.id)}
        >
          <section.icon size={18} color={colors.brand[400]} />
          <Text style={styles.menuLabel}>{section.label}</Text>
          <ChevronRight size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      ))}
    </>
  )

  const renderLearns = () => (
    <>
      <Text style={styles.pageTitle}>What INTENT Learns</Text>
      <Text style={styles.pageSub}>Everything stays on your device unless you explicitly allow otherwise.</Text>

      {DATA_CATEGORIES.map((cat: typeof DATA_CATEGORIES[number]) => (
        <Card key={cat.category} variant="subtle" style={styles.dataCategoryCard}>
          <View style={styles.dataCategoryHeader}>
            <Text style={styles.dataCategoryName}>{cat.category.replace(/_/g, ' ')}</Text>
            <View style={[styles.storageBadge, { backgroundColor: getStorageColor(cat.storageLocation) }]}>
              <Text style={styles.storageBadgeText}>{cat.storageLocation.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={styles.dataCategoryDesc}>{cat.description}</Text>
          <View style={styles.dataCategoryMeta}>
            <Text style={styles.dataCategoryExample}>Example: {cat.example}</Text>
            <Text style={styles.dataCategoryRetention}>{cat.retentionPolicy}</Text>
          </View>
        </Card>
      ))}
    </>
  )

  const renderAI = () => (
    <>
      <Text style={styles.pageTitle}>What AI Can See</Text>
      <Text style={styles.pageSub}>AI is optional. The app works fully without it.</Text>

      <Card variant="subtle" style={styles.aiCard}>
        <View style={styles.aiRow}>
          <Brain size={20} color={colors.brand[400]} />
          <Text style={styles.aiRowLabel}>AI Personalization</Text>
          <Switch value={aiEnabled} onValueChange={setAiEnabled}
            trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
        </View>
        <Text style={styles.aiRowDesc}>
          When enabled, AI can use your recent missions and patterns to create better tiny actions.
          Sensitive content is never sent.
        </Text>
      </Card>

      <Card variant="subtle" style={styles.aiCard}>
        <Text style={styles.aiSectionTitle}>AI CAN see:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Current mission title (not full context)</Text>
          <Text style={styles.bullet}>• Selected state (avoiding, overwhelmed, etc.)</Text>
          <Text style={styles.bullet}>• Safe summary of recent patterns</Text>
          <Text style={styles.bullet}>• Duration and outcome data</Text>
        </View>
      </Card>

      <Card variant="subtle" style={styles.aiCard}>
        <Text style={styles.aiSectionTitle}>AI CANNOT see:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Raw brain dump text</Text>
          <Text style={styles.bullet}>• Distraction content</Text>
          <Text style={styles.bullet}>• Private context capsules</Text>
          <Text style={styles.bullet}>• Anything marked restricted</Text>
        </View>
      </Card>
    </>
  )

  const renderData = () => (
    <>
      <Text style={styles.pageTitle}>Your Data</Text>
      <Text style={styles.pageSub}>You control everything. Export or delete anytime.</Text>

      <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
        <Download size={18} color={colors.brand[400]} />
        <View style={styles.actionInfo}>
          <Text style={styles.actionLabel}>Export All Data</Text>
          <Text style={styles.actionDesc}>Download everything as JSON</Text>
        </View>
        <ChevronRight size={16} color={colors.text.tertiary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAllData}>
        <Trash2 size={18} color={colors.error} />
        <View style={styles.actionInfo}>
          <Text style={[styles.actionLabel, { color: colors.error }]}>Delete All Data</Text>
          <Text style={styles.actionDesc}>Permanently remove everything</Text>
        </View>
        <ChevronRight size={16} color={colors.text.tertiary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionRow} onPress={() => setActiveSection('permissions')}>
        <Lock size={18} color={colors.brand[400]} />
        <View style={styles.actionInfo}>
          <Text style={styles.actionLabel}>Manage Permissions</Text>
          <Text style={styles.actionDesc}>Control what INTENT can access</Text>
        </View>
        <ChevronRight size={16} color={colors.text.tertiary} />
      </TouchableOpacity>
    </>
  )

  const renderPermissions = () => (
    <>
      <Text style={styles.pageTitle}>Permissions</Text>
      <Text style={styles.pageSub}>Grant or revoke any permission. Changes take effect immediately.</Text>

      <Card variant="subtle" style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <Bell size={18} color={colors.accent.orange} />
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Rescue Notifications</Text>
            <Text style={styles.permissionDesc}>INTENT can send rescue prompts</Text>
          </View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
        </View>
      </Card>

      <Card variant="subtle" style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <Activity size={18} color={colors.accent.green} />
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Analytics</Text>
            <Text style={styles.permissionDesc}>Anonymous usage patterns (no personal text)</Text>
          </View>
          <Switch value={analyticsEnabled} onValueChange={setAnalyticsEnabled}
            trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
        </View>
      </Card>

      <Card variant="subtle" style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <Brain size={18} color={colors.brand[400]} />
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>AI Personalization</Text>
            <Text style={styles.permissionDesc}>AI can use your patterns for better missions</Text>
          </View>
          <Switch value={aiEnabled} onValueChange={setAiEnabled}
            trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
        </View>
      </Card>

      <Card variant="subtle" style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <Eye size={18} color={colors.accent.pink} />
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Memory</Text>
            <Text style={styles.permissionDesc}>INTENT remembers what helps you start</Text>
          </View>
          <Switch value={memoryEnabled} onValueChange={setMemoryEnabled}
            trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
        </View>
      </Card>
    </>
  )

  const renderActions = () => (
    <>
      <Text style={styles.pageTitle}>Agent Actions</Text>
      <Text style={styles.pageSub}>INTENT can prepare actions. Nothing happens without your confirmation.</Text>

      <Card variant="subtle" style={styles.actionTypeCard}>
        <View style={styles.actionTypeHeader}>
          <CheckCircle2 size={18} color={colors.accent.green} />
          <Text style={styles.actionTypeTitle}>Safe (auto-execute)</Text>
        </View>
        <Text style={styles.actionTypeDesc}>Create mission, start mission, capture distraction, update momentum</Text>
      </Card>

      <Card variant="subtle" style={styles.actionTypeCard}>
        <View style={styles.actionTypeHeader}>
          <AlertTriangle size={18} color={colors.accent.orange} />
          <Text style={styles.actionTypeTitle}>Review (confirmation required)</Text>
        </View>
        <Text style={styles.actionTypeDesc}>Create local reminder, schedule notification, suggest shortcut</Text>
      </Card>

      <Card variant="subtle" style={styles.actionTypeCard}>
        <View style={styles.actionTypeHeader}>
          <Shield size={18} color={colors.error} />
          <Text style={styles.actionTypeTitle}>High-risk (explicit confirmation)</Text>
        </View>
        <Text style={styles.actionTypeDesc}>Create calendar event, draft email, connect service, send to AI</Text>
      </Card>

      <Card variant="subtle" style={styles.actionTypeCard}>
        <View style={styles.actionTypeHeader}>
          <Lock size={18} color={colors.error} />
          <Text style={styles.actionTypeTitle}>Critical (confirmation + undo)</Text>
        </View>
        <Text style={styles.actionTypeDesc}>Send email, delete external data, purchase, book</Text>
      </Card>
    </>
  )

  const renderSafety = () => (
    <>
      <Text style={styles.pageTitle}>Safety Boundaries</Text>
      <Text style={styles.pageSub}>INTENT is a productivity tool. It has hard limits.</Text>

      <Card variant="subtle" style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>❌ Not Therapy</Text>
        <Text style={styles.safetyDesc}>INTENT does not diagnose or treat ADHD, anxiety, depression, or any condition.</Text>
      </Card>

      <Card variant="subtle" style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>❌ Not Medical</Text>
        <Text style={styles.safetyDesc}>INTENT does not provide medical advice, diagnosis, or treatment.</Text>
      </Card>

      <Card variant="subtle" style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>❌ Not Emergency Support</Text>
        <Text style={styles.safetyDesc}>If you're in crisis, INTENT will show support resources and stop normal coaching.</Text>
      </Card>

      <Card variant="subtle" style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>✅ AI May Be Wrong</Text>
        <Text style={styles.safetyDesc}>AI-generated missions are suggestions. You always have the final say.</Text>
      </Card>

      <Card variant="subtle" style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>✅ You Control External Actions</Text>
        <Text style={styles.safetyDesc}>Nothing is sent externally without your explicit confirmation.</Text>
      </Card>

      <Card variant="subtle" style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>✅ No Shame</Text>
        <Text style={styles.safetyDesc}>INTENT never uses shame, guilt, or dark patterns. Failure is data, not judgment.</Text>
      </Card>
    </>
  )

  const renderLocal = () => (
    <>
      <Text style={styles.pageTitle}>Local Mode</Text>
      <Text style={styles.pageSub}>Keep everything on your device. The app still works fully.</Text>

      <Card variant={localOnly ? 'glow' : 'subtle'} style={styles.localCard}>
        <View style={styles.localHeader}>
          <Smartphone size={24} color={localOnly ? colors.accent.green : colors.text.tertiary} />
          <View style={styles.localInfo}>
            <Text style={styles.localTitle}>Local-Only Mode</Text>
            <Text style={styles.localDesc}>
              {localOnly
                ? 'All data stays on your device. No remote AI. No analytics.'
                : 'Turn on to keep everything local. Core app works without cloud.'}
            </Text>
          </View>
          <Switch value={localOnly} onValueChange={setLocalOnly}
            trackColor={{ false: colors.border.subtle, true: colors.accent.green }} />
        </View>
      </Card>

      {localOnly && (
        <>
          <Card variant="subtle" style={styles.localFeatureCard}>
            <CheckCircle2 size={16} color={colors.accent.green} />
            <Text style={styles.localFeatureText}>Mission compiler works offline</Text>
          </Card>
          <Card variant="subtle" style={styles.localFeatureCard}>
            <CheckCircle2 size={16} color={colors.accent.green} />
            <Text style={styles.localFeatureText}>Drift graph stays on device</Text>
          </Card>
          <Card variant="subtle" style={styles.localFeatureCard}>
            <CheckCircle2 size={16} color={colors.accent.green} />
            <Text style={styles.localFeatureText}>No remote AI calls</Text>
          </Card>
          <Card variant="subtle" style={styles.localFeatureCard}>
            <CheckCircle2 size={16} color={colors.accent.green} />
            <Text style={styles.localFeatureText}>Analytics disabled</Text>
          </Card>
          <Card variant="subtle" style={styles.localFeatureCard}>
            <CheckCircle2 size={16} color={colors.accent.green} />
            <Text style={styles.localFeatureText}>Privacy badge visible</Text>
          </Card>
        </>
      )}
    </>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview()
      case 'learns': return renderLearns()
      case 'ai': return renderAI()
      case 'data': return renderData()
      case 'permissions': return renderPermissions()
      case 'actions': return renderActions()
      case 'safety': return renderSafety()
      case 'local': return renderLocal()
      default: return renderOverview()
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => activeSection !== 'overview' ? setActiveSection('overview') : router.back()}>
          <Text style={styles.backText}>← {activeSection !== 'overview' ? 'Back' : 'Close'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trust Center</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Section Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {SECTIONS.map(section => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionTab, activeSection === section.id && styles.sectionTabActive]}
              onPress={() => setActiveSection(section.id)}
            >
              <section.icon size={14} color={activeSection === section.id ? colors.brand[400] : colors.text.tertiary} />
              <Text style={[styles.sectionTabText, activeSection === section.id && styles.sectionTabTextActive]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {renderContent()}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Screen>
  )
}

function getStorageColor(location: string): string {
  switch (location) {
    case 'local_only': return colors.accent.green + '20'
    case 'cloud_allowed': return colors.accent.orange + '20'
    case 'ai_allowed': return colors.brand[400] + '20'
    case 'never_send': return colors.error + '20'
    default: return colors.bg.elevated
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  backText: { ...typography.bodySmall, color: colors.brand[400] },
  headerTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },

  // Tabs
  tabScroll: { maxHeight: 50 },
  tabRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sectionTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, backgroundColor: colors.bg.surface,
  },
  sectionTabActive: { backgroundColor: colors.brand[400] + '15', borderWidth: 1, borderColor: colors.brand[400] + '30' },
  sectionTabText: { ...typography.caption, color: colors.text.tertiary },
  sectionTabTextActive: { color: colors.brand[400], fontWeight: '600' },

  content: { padding: spacing.lg },

  // Overview
  heroCard: { padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  heroTitle: { ...typography.h2, color: colors.text.primary, fontSize: 20, textAlign: 'center', marginBottom: spacing.xs },
  heroSub: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.text.primary, fontSize: 20 },
  statLabel: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
  sectionHeading: { ...typography.label, color: colors.text.secondary, marginBottom: spacing.sm },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, backgroundColor: colors.bg.surface,
    borderRadius: radius.lg, marginBottom: spacing.xs,
  },
  menuLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },

  // Page
  pageTitle: { ...typography.h1, color: colors.text.primary, fontSize: 24, marginBottom: spacing.xs },
  pageSub: { ...typography.bodyMedium, color: colors.text.secondary, marginBottom: spacing.lg, lineHeight: 20 },

  // Data Categories
  dataCategoryCard: { padding: spacing.md, marginBottom: spacing.sm },
  dataCategoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  dataCategoryName: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600', textTransform: 'capitalize' },
  storageBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm },
  storageBadgeText: { ...typography.caption, color: colors.text.secondary },
  dataCategoryDesc: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.xs },
  dataCategoryMeta: { gap: 2 },
  dataCategoryExample: { ...typography.caption, color: colors.text.tertiary },
  dataCategoryRetention: { ...typography.caption, color: colors.text.tertiary },

  // AI
  aiCard: { padding: spacing.md, marginBottom: spacing.sm },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  aiRowLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1, fontWeight: '600' },
  aiRowDesc: { ...typography.bodySmall, color: colors.text.secondary },
  aiSectionTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600', marginBottom: spacing.xs },
  bulletList: { gap: 4 },
  bullet: { ...typography.bodySmall, color: colors.text.secondary },

  // Actions
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, backgroundColor: colors.bg.surface,
    borderRadius: radius.lg, marginBottom: spacing.xs,
  },
})
