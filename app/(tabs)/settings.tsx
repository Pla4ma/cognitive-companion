     1|// ══════════════════════════════════════════════════════════════
     2|// INTENT — Settings + Trust Center v3
     3|// Privacy-first. Data controls. AI visibility. Safety boundaries.
     4|// ══════════════════════════════════════════════════════════════
     5|
     6|import React, { useState } from 'react'
     7|import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native'
     8|import { X, User, Bell, Palette, Download, Trash2, ChevronRight, Heart, Star, LogOut, Shield, Eye, Database, Lock } from 'lucide-react-native'
     9|import { useRouter } from 'expo-router'
    10|import { useAppStore } from '../../src/store'
    11|import { getCoachPersona, PushStyle } from '../../src/types'
    12|import { createEmptyRetentionState } from '../../src/services/retention/retentionEngine'
    13|import { colors, spacing, radius, typography } from '../../src/theme'
    14|import { Screen, Card, SectionHeader } from '../../src/components'
    15|
    16|type SettingsTab = 'main' | 'trust' | 'data'
    17|
    18|export default function SettingsScreen() {
    19|  const router = useRouter()
    20|  const user = useAppStore((s) => s.user)
    21|  const updateProfile = useAppStore((s) => s.updateProfile)
    22|  const signOut = useAppStore((s) => s.signOut)
    23|
    24|  const [tab, setTab] = useState<SettingsTab>('main')
    25|  const [editName, setEditName] = useState(false)
    26|  const [nameValue, setNameValue] = useState(user?.display_name ?? '')
    27|  const [smartAlerts, setSmartAlerts] = useState(true)
    28|  const [weeklyDigest, setWeeklyDigest] = useState(false)
    29|  const [coachPrompts, setCoachPrompts] = useState(true)
    30|
    31|  const persona = getCoachPersona(user?.push_style ?? 'gentle')
    32|
    33|  const handleSaveName = () => {
    34|    updateProfile({ display_name: nameValue.trim() })
    35|    setEditName(false)
    36|  }
    37|
    38|  const handleSignOut = () => {
    39|    Alert.alert('Sign Out', 'Are you sure?', [
    40|      { text: 'Cancel', style: 'cancel' },
    41|      { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); router.replace('/') } },
    42|    ])
    43|  }
    44|
    45|  const handleDeleteData = () => {
    46|    Alert.alert('Delete All Data', 'This will permanently delete all your missions, sessions, and patterns. This cannot be undone.', [
    47|      { text: 'Cancel', style: 'cancel' },
    48|      {
    49|        text: 'Delete Everything',
    50|        style: 'destructive',
    51|        onPress: () => {
    52|          try {
    53|            // Clear all data in one atomic setState call
    54|            useAppStore.setState({
    55|              sessions: [],
    56|              activeSession: null,
    57|              missions: [],
    58|              microMissions: [],
    59|              resistancePatterns: [],
    60|              distractions: [],
    61|              brainDumps: [],
    62|              momentumEvents: [],
    63|              sessionCount: 0,
    64|              skipCount: 0,
    65|              retentionState: createEmptyRetentionState(),
    66|            })
    67|            Alert.alert('Deleted', 'All data has been deleted.')
    68|          } catch {
    69|            Alert.alert('Error', 'Failed to delete all data. Please try again.')
    70|          }
    71|        },
    72|      },
    73|    ])
    74|  }
    75|
    76|  return (
    77|    <Screen gradient={['rgba(108,58,237,0.03)', 'transparent']}>
    78|      {/* Header */}
    79|      <View style={styles.header}>
    80|        <Text style={styles.title}>{tab === 'trust' ? 'Trust Center' : tab === 'data' ? 'Your Data' : 'Settings'}</Text>
    81|        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
    82|          <X size={24} color={colors.text.tertiary} />
    83|        </TouchableOpacity>
    84|      </View>
    85|
    86|      {/* Tabs */}
    87|      <View style={styles.tabRow}>
    88|        {(['main', 'trust', 'data'] as const).map(t => (
    89|          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
    90|            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'main' ? 'Settings' : t === 'trust' ? 'Trust' : 'Data'}</Text>
    91|          </TouchableOpacity>
    92|        ))}
    93|      </View>
    94|
    95|      <ScrollView showsVerticalScrollIndicator={false}>
    96|        {/* MAIN TAB */}
    97|        {tab === 'main' && (
    98|          <>
    99|            {/* Profile */}
   100|            <SectionHeader title="Profile" icon={<User size={16} color={colors.brand[400]} />} />
   101|            <Card variant="default" style={styles.profileCard}>
   102|              <View style={styles.profileRow}>
   103|                <View style={[styles.avatar, { backgroundColor: colors.brand[500] }]}>
   104|                  <Text style={styles.avatarText}>{(user?.display_name || 'U').charAt(0).toUpperCase()}</Text>
   105|                </View>
   106|                <View style={styles.profileInfo}>
   107|                  {editName ? (
   108|                    <View style={styles.nameEdit}>
   109|                      <TextInput style={styles.nameInput} value={nameValue} onChangeText={setNameValue} autoFocus onBlur={handleSaveName} onSubmitEditing={handleSaveName} />
   110|                    </View>
   111|                  ) : (
   112|                    <TouchableOpacity onPress={() => setEditName(true)}>
   113|                      <Text style={styles.profileName}>{user?.display_name || 'Set your name'}</Text>
   114|                    </TouchableOpacity>
   115|                  )}
   116|                  <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
   117|                </View>
   118|              </View>
   119|            </Card>
   120|
   121|            {/* Push Style */}
   122|            <SectionHeader title="Push Style" icon={<Palette size={16} color={colors.accent.pink} />} />
   123|            <Card variant="default" style={styles.styleCard}>
   124|              <View style={styles.styleRow}>
   125|                <Text style={styles.styleEmoji}>{persona.emoji}</Text>
   126|                <View style={styles.styleInfo}>
   127|                  <Text style={styles.styleName}>{persona.name}</Text>
   128|                  <Text style={styles.styleDesc}>{persona.description}</Text>
   129|                </View>
   130|                <ChevronRight size={16} color={colors.text.tertiary} />
   131|              </View>
   132|              <Text style={styles.styleGreeting}>{persona.name}</Text>
   133|            </Card>
   134|
   135|            {/* Notifications */}
   136|            <SectionHeader title="Notifications" icon={<Bell size={16} color={colors.accent.orange} />} />
   137|            <Card variant="default" style={styles.notifCard}>
   138|              <View style={styles.notifRow}>
   139|                <Text style={styles.notifLabel}>Rescue Prompts</Text>
   140|                <Switch value={smartAlerts} onValueChange={setSmartAlerts} trackColor={{ false: colors.border.default, true: colors.brand[500] }} />
   141|              </View>
   142|              <View style={styles.notifRow}>
   143|                <Text style={styles.notifLabel}>Streak Protection</Text>
   144|                <Switch value={weeklyDigest} onValueChange={setWeeklyDigest} trackColor={{ false: colors.border.default, true: colors.brand[500] }} />
   145|              </View>
   146|              <View style={styles.notifRow}>
   147|                <Text style={styles.notifLabel}>Haptic Feedback</Text>
   148|                <Switch value={coachPrompts} onValueChange={setCoachPrompts} trackColor={{ false: colors.border.default, true: colors.brand[500] }} />
   149|              </View>
   150|            </Card>
   151|
   152|            {/* About */}
   153|            <SectionHeader title="About" icon={<Heart size={16} color={colors.accent.pink} />} />
   154|            <Card variant="subtle" style={styles.aboutCard}>
   155|              <Text style={styles.aboutText}>INTENT v1.0.0{'\n'}Built with ❤️ for people who mean it</Text>
   156|            </Card>
   157|
   158|            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
   159|              <LogOut size={18} color={colors.error} />
   160|              <Text style={styles.signOutText}>Sign Out</Text>
   161|            </TouchableOpacity>
   162|          </>
   163|        )}
   164|
   165|        {/* TRUST TAB → redirects to dedicated Trust Center */}
   166|        {tab === 'trust' && (
   167|          <Card variant="glow" style={styles.trustRedirectCard}>
   168|            <Shield size={32} color={colors.brand[500]} style={{ marginBottom: spacing.sm }} />
   169|            <Text style={styles.trustRedirectTitle}>Trust Center</Text>
   170|            <Text style={styles.trustRedirectDesc}>
   171|              Your privacy dashboard has moved to a dedicated experience with full transparency controls, permission management, and data rights.
   172|            </Text>
   173|            <TouchableOpacity
   174|              style={styles.trustRedirectBtn}
   175|              onPress={() => router.push('/trust')}
   176|            >
   177|              <Text style={styles.trustRedirectBtnText}>Open Trust Center</Text>
   178|              <ChevronRight size={16} color={colors.text.inverse} />
   179|            </TouchableOpacity>
   180|          </Card>
   181|        )}
   182|
   183|        {/* DATA TAB */}
   184|        {tab === 'data' && (
   185|          <>
   186|            <Card variant="default" style={styles.dataCard}>
   187|              <TouchableOpacity style={styles.dataRow}>
   188|                <Download size={18} color={colors.brand[400]} />
   189|                <Text style={styles.dataLabel}>Export Your Data</Text>
   190|                <ChevronRight size={16} color={colors.text.tertiary} />
   191|              </TouchableOpacity>
   192|            <TouchableOpacity style={styles.dataRow} onPress={() => router.push('/memory')}>
   193|              <Database size={18} color={colors.brand[400]} />
   194|              <Text style={styles.dataLabel}>Memory Controls</Text>
   195|              <ChevronRight size={16} color={colors.text.tertiary} />
   196|            </TouchableOpacity>
   197|
   198|            <TouchableOpacity style={styles.dataRow} onPress={handleDeleteData}>
   199|                <Trash2 size={18} color={colors.error} />
   200|                <Text style={[styles.dataLabel, { color: colors.error }]}>Delete All Data</Text>
   201|                <ChevronRight size={16} color={colors.text.tertiary} />
   202|              </TouchableOpacity>
   203|            </Card>
   204|
   205|            <Card variant="subtle" style={styles.dataInfo}>
   206|              <Text style={styles.dataInfoText}>
   207|                Your data is stored locally on your device. INTENT does not sync to any cloud server.
   208|                You can export or delete all data at any time.
   209|              </Text>
   210|            </Card>
   211|          </>
   212|        )}
   213|
   214|        <View style={{ height: spacing.xxxl }} />
   215|      </ScrollView>
   216|    </Screen>
   217|  )
   218|}
   219|
   220|const styles = StyleSheet.create({
   221|  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
   222|  title: { ...typography.headline, color: colors.text.primary },
   223|  closeBtn: { padding: spacing.xs },
   224|  tabRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
   225|  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bg.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle },
   226|  tabActive: { backgroundColor: colors.brand[500] + '15', borderColor: colors.brand[500] + '30' },
   227|  tabText: { ...typography.bodySmall, color: colors.text.tertiary },
   228|  tabTextActive: { color: colors.brand[400], fontWeight: '600' },
   229|
   230|  profileCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
   231|  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
   232|  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
   233|  avatarText: { ...typography.h2, color: colors.text.inverse, fontSize: 20 },
   234|  profileInfo: { flex: 1 },
   235|  profileName: { ...typography.h3, color: colors.text.primary },
   236|  profileEmail: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },
   237|  nameEdit: { flex: 1 },
   238|  nameInput: { ...typography.h3, color: colors.text.primary, borderBottomWidth: 1, borderBottomColor: colors.brand[500], paddingVertical: 2 },
   239|
   240|  styleCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
   241|  styleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
   242|  styleEmoji: { fontSize: 28 },
   243|  styleInfo: { flex: 1 },
   244|  styleName: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
   245|  styleDesc: { ...typography.caption, color: colors.text.tertiary, textTransform: 'capitalize' },
   246|  styleGreeting: { ...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.sm, fontStyle: 'italic' },
   247|
   248|  notifCard: { padding: spacing.sm, marginBottom: spacing.sectionGap },
   249|  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
   250|  notifLabel: { ...typography.bodyMedium, color: colors.text.primary },
   251|
   252|  aboutCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
   253|  aboutText: { ...typography.bodySmall, color: colors.text.tertiary, lineHeight: 20 },
   254|  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error + '30', justifyContent: 'center' },
   255|  signOutText: { ...typography.bodyMedium, color: colors.error, fontWeight: '600' },
   256|
   257|  trustRedirectCard: {
   258|    padding: spacing.xl,
   259|    alignItems: 'center',
   260|    marginBottom: spacing.md,
   261|  },
   262|  trustRedirectTitle: {
   263|    ...typography.h2,
   264|    color: colors.text.primary,
   265|    marginBottom: spacing.xs,
   266|  },
   267|  trustRedirectDesc: {
   268|    ...typography.bodyMedium,
   269|    color: colors.text.tertiary,
   270|    textAlign: 'center',
   271|    lineHeight: 22,
   272|    marginBottom: spacing.md,
   273|  },
   274|  trustRedirectBtn: {
   275|    flexDirection: 'row',
   276|    alignItems: 'center',
   277|    gap: spacing.xs,
   278|    backgroundColor: colors.brand[500],
   279|    borderRadius: radius.xl,
   280|    paddingHorizontal: spacing.lg,
   281|    paddingVertical: spacing.sm,
   282|  },
   283|  trustRedirectBtnText: {
   284|    ...typography.buttonSmall,
   285|    color: colors.text.inverse,
   286|  },
   287|
   288|  dataCard: { padding: spacing.sm, marginBottom: spacing.sm },
   289|  dataRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
   290|  dataLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },
   291|  dataInfo: { padding: spacing.lg },
   292|  dataInfoText: { ...typography.bodySmall, color: colors.text.tertiary, lineHeight: 18 },
   293|})
   294|