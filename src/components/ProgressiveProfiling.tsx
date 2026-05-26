// ══════════════════════════════════════════════════════════════
// INTENT — Progressive Profiling Component
// Contextual questions shown after sessions to learn about the user
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native'
import { BlurView } from 'expo-blur'
import { X } from 'lucide-react-native'
import { Card } from './Card'
import { Button } from './Button'
import { colors, spacing, radius, typography } from '../theme'

// ── Types ──────────────────────────────────────────────────

type QuestionType = 'work_type' | 'struggle_time' | 'biggest_project'

interface ProgressiveProfilingProps {
  questionType: QuestionType
  onComplete: (answer: string) => void
  onDismiss: () => void
}

// ── Question configs ───────────────────────────────────────

const QUESTIONS: Record<QuestionType, { prompt: string; chips?: string[] }> = {
  work_type: {
    prompt: 'What type of work were you doing?',
    chips: ['Creative', 'Administrative', 'Learning', 'Communication'],
  },
  struggle_time: {
    prompt: 'What time of day do you usually struggle?',
    chips: ['Morning', 'Afternoon', 'Evening', 'Late night'],
  },
  biggest_project: {
    prompt: "What's your biggest ongoing project?",
  },
}

// ── Component ──────────────────────────────────────────────

export function ProgressiveProfiling({ questionType, onComplete, onDismiss }: ProgressiveProfilingProps) {
  const [textValue, setTextValue] = useState('')
  const question = QUESTIONS[questionType]

  const handleChipSelect = (chip: string) => {
    onComplete(chip)
  }

  const handleTextSubmit = () => {
    const trimmed = textValue.trim()
    if (trimmed) onComplete(trimmed)
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <BlurView intensity={40} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick question</Text>
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <Card variant="subtle" style={styles.card}>
            <Text style={styles.prompt}>{question.prompt}</Text>

            {question.chips ? (
              <View style={styles.chipRow}>
                {question.chips.map((chip) => (
                  <TouchableOpacity key={chip} style={styles.chip} onPress={() => handleChipSelect(chip)} activeOpacity={0.7}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type your answer..."
                  placeholderTextColor={colors.text.disabled}
                  value={textValue}
                  onChangeText={setTextValue}
                  autoFocus
                  multiline={false}
                  returnKeyType="done"
                  onSubmitEditing={handleTextSubmit}
                />
                <Button
                  title="Submit"
                  onPress={handleTextSubmit}
                  variant="primary"
                  size="sm"
                  disabled={!textValue.trim()}
                  style={{ marginTop: spacing.sm, alignSelf: 'flex-end' }}
                />
              </>
            )}
          </Card>
        </BlurView>
      </View>
    </Modal>
  )
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  card: {
    padding: spacing.lg,
  },
  prompt: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    color: colors.text.primary,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
})
