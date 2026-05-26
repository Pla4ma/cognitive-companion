// ══════════════════════════════════════════════════════════════
// INTENT — Settings + Trust Center v3
// Privacy-first. Data controls. AI visibility. Safety boundaries.
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native'
import { X, User, Bell, Palette, Download, Trash2, ChevronRight, Heart, Star, LogOut, Shield, Eye, Database, Lock } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '../src/store'
import { getCoachPersona, PushStyle } from '../src/types'
import { colors, spacing, radius, typography } from '../src/theme'
import { Screen, Card, SectionHeader } from '../src/components'

type SettingsTab = 'main' | 'trust' | 'data'

export default function SettingsScreen() {
  const router = useRouter()
  const user = useAppStore((s) => s.user)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const signOut = useAppStore((s) => s.signOut)

  const [tab, setTab] = useState<SettingsTab>('main')
  const [editName, setEditName] = useState(false)
  const [nameValue, setNameValue] = useState(user?.display_name ?? '')

  const persona = getCoachPersona(user?.push_style ?? 'gentle')

  const handleSaveName = () => {
    updateProfile({ display_name: nameValue.trim() })
    setEditName(false)
    void 0
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); router.replace('/') } },
    ])
  }

  const handleDeleteData = () => {
    Alert.alert('Delete All Data', 'This will permanently delete all your missions, sessions, and patterns. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: () => {
          try {
            const store = useAppStore.getState()
            // Clear all sessions
            store.sessions.forEach(s => store.abandonSession())
            // Clear all missions
            store.missions.forEach(m => store.deleteMission(m.id))
            // Clear resistance patterns, distractions, brain dumps, momentum events
            useAppStore.setState({
              sessions: [],
              activeSession: null,
              missions: [],
              microMissions: [],
              resistancePatterns: [],
              distractions: [],
              brainDumps: [],
              momentumEvents: [],
              retentionState: {
                totalRescues: 0,
                totalMinutesRescued: 0,
                activationDate: null,
                lastSessionDate: null,
                comebackDays: [],
                socialProofStats: {},
                momentumWindows: { weekly: 0, biweekly: 0, monthly: 0 },
                loopStatus: {},
                weeklyNarrative: null,
                weeklyNarrativeDate: null,
              },
            })
            Alert.alert('Deleted', 'All data has been deleted.')
          } catch {
            Alert.alert('Error', 'Failed to delete all data. Please try again.')
          }
        },
      },
    ])
  }

  return (
    <Screen gradient={['rgba(108,58,237,0.03)', 'transparent']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{tab === 'trust' ? 'Trust Center' : tab === 'data' ? 'Your Data' : 'Settings'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['main', 'trust', 'data'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'main' ? 'Settings' : t === 'trust' ? 'Trust' : 'Data'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* MAIN TAB */}
        {tab === 'main' && (
          <>
            {/* Profile */}
            <SectionHeader title="Profile" icon={<User size={16} color={colors.brand[400]} />} />
            <Card variant="default" style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={[styles.avatar, { backgroundColor: colors.brand[500] }]}>
                  <Text style={styles.avatarText}>{(user?.display_name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.profileInfo}>
                  {editName ? (
                    <View style={styles.nameEdit}>
                      <TextInput style={styles.nameInput} value={nameValue} onChangeText={setNameValue} autoFocus onBlur={handleSaveName} onSubmitEditing={handleSaveName} />
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setEditName(true)}>
                      <Text style={styles.profileName}>{user?.display_name || 'Set your name'}</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
                </View>
              </View>
            </Card>

            {/* Push Style */}
            <SectionHeader title="Push Style" icon={<Palette size={16} color={colors.accent.pink} />} />
            <Card variant="default" style={styles.styleCard}>
              <View style={styles.styleRow}>
                <Text style={styles.styleEmoji}>{persona.emoji}</Text>
                <View style={styles.styleInfo}>
                  <Text style={styles.styleName}>{persona.name}</Text>
                  <Text style={styles.styleDesc}>{persona.description}</Text>
                </View>
                <ChevronRight size={16} color={colors.text.tertiary} />
              </View>
              <Text style={styles.styleGreeting}>{persona.name}</Text>
            </Card>

            {/* Notifications */}
            <SectionHeader title="Notifications" icon={<Bell size={16} color={colors.accent.orange} />} />
            <Card variant="default" style={styles.notifCard}>
              <View style={styles.notifRow}>
                <Text style={styles.notifLabel}>Rescue Prompts</Text>
                <Switch value={true} onValueChange={() => {}} trackColor={{ false: colors.border.default, true: colors.brand[500] }} />
              </View>
              <View style={styles.notifRow}>
                <Text style={styles.notifLabel}>Streak Protection</Text>
                <Switch value={false} onValueChange={() => {}} trackColor={{ false: colors.border.default, true: colors.brand[500] }} />
              </View>
              <View style={styles.notifRow}>
                <Text style={styles.notifLabel}>Haptic Feedback</Text>
                <Switch value={true} onValueChange={() => {}} trackColor={{ false: colors.border.default, true: colors.brand[500] }} />
              </View>
            </Card>

            {/* About */}
            <SectionHeader title="About" icon={<Heart size={16} color={colors.accent.pink} />} />
            <Card variant="subtle" style={styles.aboutCard}>
              <Text style={styles.aboutText}>INTENT v1.0.0{'\n'}Built with ❤️ for people who mean it</Text>
            </Card>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <LogOut size={18} color={colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}

        {/* TRUST TAB → redirects to dedicated Trust Center */}
        {tab === 'trust' && (
          <Card variant="glow" style={styles.trustRedirectCard}>
            <Shield size={32} color={colors.brand[500]} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.trustRedirectTitle}>Trust Center</Text>
            <Text style={styles.trustRedirectDesc}>
              Your privacy dashboard has moved to a dedicated experience with full transparency controls, permission management, and data rights.
            </Text>
            <TouchableOpacity
              style={styles.trustRedirectBtn}
              onPress={() => router.push('/trust')}
            >
              <Text style={styles.trustRedirectBtnText}>Open Trust Center</Text>
              <ChevronRight size={16} color={colors.text.inverse} />
            </TouchableOpacity>
          </Card>
        )}

        {/* DATA TAB */}
        {tab === 'data' && (
          <>
            <Card variant="default" style={styles.dataCard}>
              <TouchableOpacity style={styles.dataRow}>
                <Download size={18} color={colors.brand[400]} />
                <Text style={styles.dataLabel}>Export Your Data</Text>
                <ChevronRight size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            <TouchableOpacity style={styles.dataRow} onPress={() => router.push('/memory')}>
              <Database size={18} color={colors.brand[400]} />
              <Text style={styles.dataLabel}>Memory Controls</Text>
              <ChevronRight size={16} color={colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dataRow} onPress={handleDeleteData}>
                <Trash2 size={18} color={colors.error} />
                <Text style={[styles.dataLabel, { color: colors.error }]}>Delete All Data</Text>
                <ChevronRight size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            </Card>

            <Card variant="subtle" style={styles.dataInfo}>
              <Text style={styles.dataInfoText}>
                Your data is stored locally on your device. INTENT does not sync to any cloud server.
                You can export or delete all data at any time.
              </Text>
            </Card>
          </>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.headline, color: colors.text.primary },
  closeBtn: { padding: spacing.xs },
  tabRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bg.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle },
  tabActive: { backgroundColor: colors.brand[500] + '15', borderColor: colors.brand[500] + '30' },
  tabText: { ...typography.bodySmall, color: colors.text.tertiary },
  tabTextActive: { color: colors.brand[400], fontWeight: '600' },

  profileCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h2, color: colors.text.inverse, fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: colors.text.primary },
  profileEmail: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },
  nameEdit: { flex: 1 },
  nameInput: { ...typography.h3, color: colors.text.primary, borderBottomWidth: 1, borderBottomColor: colors.brand[500], paddingVertical: 2 },

  styleCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  styleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  styleEmoji: { fontSize: 28 },
  styleInfo: { flex: 1 },
  styleName: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  styleDesc: { ...typography.caption, color: colors.text.tertiary, textTransform: 'capitalize' },
  styleGreeting: { ...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.sm, fontStyle: 'italic' },

  notifCard: { padding: spacing.sm, marginBottom: spacing.sectionGap },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  notifLabel: { ...typography.bodyMedium, color: colors.text.primary },

  aboutCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  aboutText: { ...typography.bodySmall, color: colors.text.tertiary, lineHeight: 20 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error + '30', justifyContent: 'center' },
  signOutText: { ...typography.bodyMedium, color: colors.error, fontWeight: '600' },

  trustRedirectCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trustRedirectTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  trustRedirectDesc: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  trustRedirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand[500],
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  trustRedirectBtnText: {
    ...typography.buttonSmall,
    color: colors.text.inverse,
  },

  dataCard: { padding: spacing.sm, marginBottom: spacing.sm },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  dataLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },
  dataInfo: { padding: spacing.lg },
  dataInfoText: { ...typography.bodySmall, color: colors.text.tertiary, lineHeight: 18 },
})
