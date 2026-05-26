// ══════════════════════════════════════════════════════════════
// INTENT — Context Capture Sheet
// Bottom sheet for capturing new context from various sources
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

type CaptureMode = 'paste' | 'brain_dump' | 'assignment'

const MODES: { key: CaptureMode; label: string; icon: string; placeholder: string }[] = [
  {
    key: 'paste',
    label: 'Paste Text',
    icon: '📋',
    placeholder: 'Paste messy text, assignments, or anything pulling your attention...',
  },
  {
    key: 'brain_dump',
    label: 'Brain Dump',
    icon: '🧠',
    placeholder: 'Stream of consciousness. Don\'t organize. Just dump it all here...',
  },
  {
    key: 'assignment',
    label: 'Assignment',
    icon: '📝',
    placeholder: 'Paste or type your assignment. Include due date if you know it...',
  },
]

export function ContextCaptureSheet(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const [mode, setMode] = useState<CaptureMode>('paste')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [localOnly, setLocalOnly] = useState(false)
  const [extracting, setExtracting] = useState(false)

  const currentMode = MODES.find(m => m.key === mode)!
  const charCount = text.length
  const canExtract = text.trim().length > 10

  const handleExtract = () => {
    if (!canExtract) return
    setExtracting(true)
    // Simulate extraction — in production this calls contextInboxEngine
    setTimeout(() => {
      setExtracting(false)
      navigation.goBack()
      navigation.navigate('ContextToMissionFlow', {
        capsuleId: 'new',
        rawText: text,
        mode,
        title: title || undefined,
        localOnly,
      })
    }, 800)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.handle} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture Context</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.modeSelector}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
              onPress={() => setMode(m.key)}
            >
              <Text style={styles.modeIcon}>{m.icon}</Text>
              <Text
                style={[styles.modeLabel, mode === m.key && styles.modeLabelActive]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'assignment' && (
          <TextInput
            style={styles.titleInput}
            placeholder="Assignment title (optional)"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={currentMode.placeholder}
            placeholderTextColor="#555"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.charCount}>{charCount} chars</Text>
        </View>

        <View style={styles.privacyRow}>
          <View style={styles.privacyInfo}>
            <Text style={styles.privacyLabel}>Keep local only</Text>
            <Text style={styles.privacyDesc}>
              {localOnly
                ? 'No AI processing. Deterministic extraction only.'
                : 'AI can enhance extraction if enabled in settings.'}
            </Text>
          </View>
          <Switch
            value={localOnly}
            onValueChange={setLocalOnly}
            trackColor={{ false: '#333', true: '#00ff88' }}
            thumbColor={localOnly ? '#fff' : '#888'}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.extractButton, !canExtract && styles.extractButtonDisabled]}
          onPress={handleExtract}
          disabled={!canExtract || extracting}
          activeOpacity={0.8}
        >
          <Text style={styles.extractButtonText}>
            {extracting ? 'Extracting...' : 'Extract Actions'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  cancelText: { fontSize: 16, color: '#888' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modeChipActive: { borderColor: '#00ff88', backgroundColor: '#00ff8815' },
  modeIcon: { fontSize: 20, marginBottom: 4 },
  modeLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  modeLabelActive: { color: '#00ff88' },
  titleInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 16,
  },
  textInput: {
    padding: 16,
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 22,
    minHeight: 200,
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 12,
    color: '#555',
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  privacyInfo: { flex: 1, marginRight: 12 },
  privacyLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  privacyDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  extractButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  extractButtonDisabled: { backgroundColor: '#1a3a2a', opacity: 0.6 },
  extractButtonText: { fontSize: 17, fontWeight: '700', color: '#0a0a0a' },
})
