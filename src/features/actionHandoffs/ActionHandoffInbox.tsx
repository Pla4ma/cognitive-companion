// ══════════════════════════════════════════════════════════════
// INTENT — Action Handoff Inbox
// Grouped listing of all proposed action handoffs
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import type { ActionHandoff, ActionHandoffType, ActionHandoffStatus } from '../../types/actionHandoff'
import { RISK_LEVEL_COPY } from '../../types/actionHandoff'

interface ActionHandoffInboxProps {
  handoffs: ActionHandoff[]
  onHandoffPress: (handoff: ActionHandoff) => void
  onDismiss: (handoffId: string) => void
  onRefresh: () => Promise<void>
}

type GroupKey = ActionHandoffType

const GROUP_LABELS: Record<GroupKey, { label: string; icon: string }> = {
  reminder: { label: 'Reminders', icon: '⏰' },
  calendar_block: { label: 'Calendar', icon: '📅' },
  email_draft: { label: 'Email Drafts', icon: '📧' },
  message_draft: { label: 'Messages', icon: '💬' },
  checklist: { label: 'Checklists', icon: '✅' },
  study_plan: { label: 'Study Plans', icon: '📚' },
}

const STATUS_LABELS: Record<ActionHandoffStatus, { color: string; label: string }> = {
  proposed: { color: '#ffaa00', label: 'Proposed' },
  reviewed: { color: '#3B82F6', label: 'Reviewed' },
  copied: { color: '#888888', label: 'Copied' },
  opened: { color: '#6C3AED', label: 'Opened' },
  completed: { color: '#00ff88', label: 'Done' },
  canceled: { color: '#ff4444', label: 'Canceled' },
}

interface SectionData {
  title: string
  icon: string
  key: GroupKey
  data: ActionHandoff[]
}

export function ActionHandoffInbox({
  handoffs,
  onHandoffPress,
  onDismiss,
  onRefresh,
}: ActionHandoffInboxProps) {
  const [refreshing, setRefreshing] = useState(false)

  const sections: SectionData[] = Object.entries(GROUP_LABELS)
    .map(([key, config]) => ({
      title: config.label,
      icon: config.icon,
      key: key as GroupKey,
      data: handoffs.filter((h) => h.type === key),
    }))
    .filter((s) => s.data.length > 0)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }, [onRefresh])

  const renderHandoff = ({ item }: { item: ActionHandoff }) => {
    const riskConfig = RISK_LEVEL_COPY[item.riskLevel]
    const statusConfig = STATUS_LABELS[item.status]

    return (
      <TouchableOpacity
        style={styles.handoffCard}
        onPress={() => onHandoffPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <Text style={styles.handoffTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.riskBadge, { backgroundColor: riskConfig.color + '22' }]}>
            <View style={[styles.riskDot, { backgroundColor: riskConfig.color }]} />
            <Text style={[styles.riskText, { color: riskConfig.color }]}>
              {riskConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.handoffPreview} numberOfLines={2}>
          {item.preview}
        </Text>

        <View style={styles.cardBottom}>
          <View style={[styles.statusBadge, { borderColor: statusConfig.color }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onDismiss(item.id)} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{section.icon}</Text>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Action Handoffs</Text>
      <Text style={styles.screenSubtitle}>
        {handoffs.length} handoff{handoffs.length !== 1 ? 's' : ''} awaiting review
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderHandoff}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyText}>No pending handoffs</Text>
            <Text style={styles.emptySubtext}>
              Handoffs will appear here when INTENT prepares actions for you
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 16,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  handoffCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  handoffTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 10,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  handoffPreview: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 13,
    color: '#ff4444',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})
