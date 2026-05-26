// ══════════════════════════════════════════════════════════════
// INTENT — Checklist Handoff Card
// Card for checklist generated from context capsules
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface ChecklistDraft {
  id: string
  title: string
  items: ChecklistItem[]
  sourceContext: string
}

interface Props {
  handoff: ChecklistDraft
  onStartFirst?: (id: string) => void
  onSave?: (id: string, items: ChecklistItem[]) => void
  onCancel?: (id: string) => void
}

export function ChecklistHandoffCard({ handoff, onStartFirst, onSave, onCancel }: Props): React.JSX.Element {
  const [items, setItems] = useState<ChecklistItem[]>(handoff.items)
  const [newItemText, setNewItemText] = useState('')

  const toggleItem = (itemId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const addItem = () => {
    if (!newItemText.trim()) return
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), text: newItemText.trim(), completed: false },
    ])
    setNewItemText('')
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const completedCount = items.filter(i => i.completed).length
  const firstIncomplete = items.find(i => !i.completed)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>☑️</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{handoff.title || 'Checklist'}</Text>
          <Text style={styles.progress}>
            {completedCount}/{items.length} complete
          </Text>
        </View>
      </View>

      {items.length > 0 && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` },
            ]}
          />
        </View>
      )}

      <View style={styles.itemsList}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemRow}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text
              style={[styles.itemText, item.completed && styles.itemTextDone]}
            >
              {item.text}
            </Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeItem(item.id)}
            >
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder="Add item..."
          placeholderTextColor="#555"
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.source}>
        <Text style={styles.sourceText}>From: {handoff.sourceContext}</Text>
      </View>

      <View style={styles.actions}>
        {firstIncomplete && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => onStartFirst?.(handoff.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.startText}>
              Start: "{firstIncomplete.text}"
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => onSave?.(handoff.id, items)}
        >
          <Text style={styles.saveText}>Save Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel?.(handoff.id)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 24, marginRight: 10 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  progress: { fontSize: 12, color: '#888', marginTop: 2 },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  itemsList: { marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxDone: { borderColor: '#00ff88', backgroundColor: '#00ff8820' },
  checkmark: { fontSize: 14, color: '#00ff88', fontWeight: '700' },
  itemText: { flex: 1, fontSize: 14, color: '#e0e0e0' },
  itemTextDone: { color: '#666', textDecorationLine: 'line-through' },
  removeBtn: { padding: 4, marginLeft: 8 },
  removeText: { fontSize: 18, color: '#555' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addInput: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#00ff8820',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff8840',
  },
  addBtnText: { fontSize: 20, color: '#00ff88', fontWeight: '700' },
  source: { marginBottom: 14 },
  sourceText: { fontSize: 12, color: '#666' },
  actions: { gap: 10 },
  startButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  saveButton: {
    backgroundColor: '#1a2a1a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff8830',
  },
  saveText: { fontSize: 14, color: '#00ff88', fontWeight: '600' },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
})
