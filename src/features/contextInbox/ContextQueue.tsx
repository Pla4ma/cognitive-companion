// ══════════════════════════════════════════════════════════════
// INTENT — Context Queue
// Pending capsules awaiting processing with batch actions
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import type { ContextCapsule } from '../../types/contextCapsule'

type ProcessingStatus = 'pending' | 'extracting' | 'ready' | 'mission_created'

interface QueueItem extends ContextCapsule {
  processingStatus: ProcessingStatus
}

interface ContextQueueProps {
  items: QueueItem[]
  onExtractAll: () => Promise<void>
  onDeleteSelected: (ids: string[]) => void
  onItemPress: (item: QueueItem) => void
}

const STATUS_CONFIG: Record<ProcessingStatus, { color: string; label: string; icon: string }> = {
  pending: { color: '#888888', label: 'Pending', icon: '⏳' },
  extracting: { color: '#ffaa00', label: 'Extracting...', icon: '⚡' },
  ready: { color: '#00ff88', label: 'Ready', icon: '✅' },
  mission_created: { color: '#6C3AED', label: 'Mission Created', icon: '🎯' },
}

export function ContextQueue({
  items,
  onExtractAll,
  onDeleteSelected,
  onItemPress,
}: ContextQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)

  const pendingCount = items.filter((i) => i.processingStatus === 'pending').length
  const hasSelection = selectedIds.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleExtractAll = useCallback(async () => {
    setIsBatchProcessing(true)
    setBatchProgress(0)
    const total = pendingCount
    let processed = 0
    const interval = setInterval(() => {
      processed++
      setBatchProgress(processed / Math.max(total, 1))
      if (processed >= total) {
        clearInterval(interval)
        setIsBatchProcessing(false)
      }
    }, 600)
    await onExtractAll()
  }, [pendingCount, onExtractAll])

  const handleDeleteSelected = useCallback(() => {
    onDeleteSelected(Array.from(selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds, onDeleteSelected])

  const renderItem = ({ item }: { item: QueueItem }) => {
    const status = STATUS_CONFIG[item.processingStatus]
    const isSelected = selectedIds.has(item.id)
    const isSelectable = item.processingStatus !== 'mission_created'

    return (
      <TouchableOpacity
        style={[styles.queueCard, isSelected && styles.queueCardSelected]}
        onPress={() => onItemPress(item)}
        onLongPress={() => isSelectable && toggleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
          {isSelectable && (
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => toggleSelect(item.id)}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.previewText} numberOfLines={2}>
          {item.summary || item.rawContent.slice(0, 150)}
        </Text>

        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>
            {item.extractedObligations.length} obligations
          </Text>
          <Text style={styles.metaText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Processing Queue</Text>
      <Text style={styles.subtitle}>
        {items.length} capsule{items.length !== 1 ? 's' : ''} · {pendingCount} pending
      </Text>

      {/* Batch Action Bar */}
      <View style={styles.batchBar}>
        <TouchableOpacity
          style={[styles.batchButton, styles.extractAllButton]}
          onPress={handleExtractAll}
          disabled={pendingCount === 0 || isBatchProcessing}
        >
          {isBatchProcessing ? (
            <View style={styles.progressRow}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.batchButtonText}>
                Processing... {Math.round(batchProgress * 100)}%
              </Text>
            </View>
          ) : (
            <Text style={styles.batchButtonText}>
              Extract All ({pendingCount})
            </Text>
          )}
        </TouchableOpacity>

        {hasSelection && (
          <TouchableOpacity
            style={[styles.batchButton, styles.deleteSelectedButton]}
            onPress={handleDeleteSelected}
          >
            <Text style={styles.deleteButtonText}>
              Delete ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isBatchProcessing && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${batchProgress * 100}%` }]} />
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubtext}>No capsules in the queue</Text>
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
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  batchBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  batchButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  extractAllButton: {
    backgroundColor: '#00ff88',
  },
  deleteSelectedButton: {
    backgroundColor: '#ff444422',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  batchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff4444',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  listContent: {
    paddingBottom: 40,
  },
  queueCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  queueCardSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#00ff8808',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  previewText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
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
  },
})
