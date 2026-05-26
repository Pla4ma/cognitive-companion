// ══════════════════════════════════════════════════════════════
// INTENT — Context Inbox Screen
// Main screen for managing context capsules
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { ContextCapsule } from '../../types/contextCapsule'
import { ContextSensitivityBadge } from './ContextSensitivityBadge'

type TabKey = 'all' | 'urgent' | 'drafts'

interface TabDef {
  key: TabKey
  label: string
}

const TABS: TabDef[] = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'drafts', label: 'Drafts' },
]

const DEMO_CAPSULES: ContextCapsule[] = []

export function ContextInboxScreen(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [capsules, setCapsules] = useState<ContextCapsule[]>(DEMO_CAPSULES)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = capsules.filter(c => {
    if (activeTab === 'urgent') return c.sensitivity === 'sensitive' || c.sensitivity === 'restricted'
    if (activeTab === 'drafts') return c.status === 'draft'
    return true
  })

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }, [])

  const handleCapture = () => {
    navigation.navigate('ContextCaptureSheet')
  }

  const handleCapsulePress = (capsule: ContextCapsule) => {
    navigation.navigate('ContextCapsuleDetail', { capsuleId: capsule.id })
  }

  const handleStartMission = (capsule: ContextCapsule) => {
    navigation.navigate('ContextToMissionFlow', { capsuleId: capsule.id })
  }

  const handleDelete = (capsule: ContextCapsule) => {
    Alert.alert('Delete Capsule', 'This will permanently remove this context capsule.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setCapsules(prev => prev.filter(c => c.id !== capsule.id)),
      },
    ])
  }

  const renderCapsule = ({ item }: { item: ContextCapsule }) => (
    <TouchableOpacity
      style={styles.capsuleCard}
      onPress={() => handleCapsulePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.capsuleHeader}>
        <ContextSensitivityBadge level={item.sensitivity ?? 'personal'} />
        <Text style={styles.capsuleDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.capsuleSummary} numberOfLines={2}>
        {item.summary || item.rawText?.slice(0, 100) || 'Untitled capsule'}
      </Text>

      <View style={styles.capsuleMeta}>
        <Text style={styles.metaText}>
          {item.extractedActions?.length ?? 0} actions
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{item.privacyLevel ?? 'local'}</Text>
      </View>

      <View style={styles.capsuleActions}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => handleStartMission(item)}
        >
          <Text style={styles.startButtonText}>Start Mission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No context yet</Text>
      <Text style={styles.emptySubtitle}>
        Drop messy text, assignments, or brain dumps.{'\n'}INTENT will extract one tiny mission.
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Context Inbox</Text>
        <Text style={styles.subtitle}>
          Throw chaos in. Get one mission out.
        </Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderCapsule}
        contentContainerStyle={filtered.length === 0 ? styles.listEmpty : styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00ff88"
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCapture}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  tabActive: { backgroundColor: '#00ff88' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#0a0a0a' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  capsuleCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capsuleDate: { fontSize: 12, color: '#666' },
  capsuleSummary: { fontSize: 15, color: '#e0e0e0', lineHeight: 22, marginBottom: 8 },
  capsuleMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 12, color: '#888' },
  metaDot: { fontSize: 12, color: '#555', marginHorizontal: 6 },
  capsuleActions: { flexDirection: 'row', gap: 10 },
  startButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
  },
  deleteButtonText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#0a0a0a', fontWeight: '700', marginTop: -2 },
})
