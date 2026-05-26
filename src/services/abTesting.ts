// ══════════════════════════════════════════════════════════════
// A/B Testing Service
// Deterministic user bucketing for experiment variants
// ══════════════════════════════════════════════════════════════

import { useAppStore } from '../store'

interface Experiment {
  variants: number[]
  weights: number[]
}

const EXPERIMENTS: Record<string, Experiment> = {
  paywall_trigger: {
    variants: [3, 5, 7],
    weights: [0.33, 0.34, 0.33],
  },
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getVariant(experiment: string): number {
  const userId = useAppStore.getState().user?.id ?? 'anon'
  const exp = EXPERIMENTS[experiment]
  if (!exp) return 0
  const hash = simpleHash(userId + experiment)
  const bucket = hash % 100
  let cumulative = 0
  for (let i = 0; i < exp.variants.length; i++) {
    cumulative += exp.weights[i] * 100
    if (bucket < cumulative) return exp.variants[i]
  }
  return exp.variants[exp.variants.length - 1]
}
