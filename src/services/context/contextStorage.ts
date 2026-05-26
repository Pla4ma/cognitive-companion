// ══════════════════════════════════════════════════════════════
// INTENT — Context Storage
// Persists and manages context capsules
// ══════════════════════════════════════════════════════════════

import type { ContextCapsule } from '../../types'

// In-memory store (replace with AsyncStorage in production)
const capsuleStore: Map<string, ContextCapsule> = new Map()

export function saveCapsule(capsule: ContextCapsule): void {
  capsuleStore.set(capsule.id, capsule)
}

export function getCapsule(id: string): ContextCapsule | null {
  return capsuleStore.get(id) || null
}

export function getAllCapsules(): ContextCapsule[] {
  return Array.from(capsuleStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getUnprocessedCapsules(): ContextCapsule[] {
  return getAllCapsules().filter(c => c.createdMissions.length === 0)
}

export function deleteCapsule(id: string): boolean {
  return capsuleStore.delete(id)
}

export function deleteAllCapsules(): void {
  capsuleStore.clear()
}

export function updateCapsuleMissions(capsuleId: string, missionIds: string[]): void {
  const capsule = capsuleStore.get(capsuleId)
  if (capsule) {
    capsule.createdMissions = [...capsule.createdMissions, ...missionIds]
    capsuleStore.set(capsuleId, capsule)
  }
}

export function getCapsuleCount(): number {
  return capsuleStore.size
}

// Auto-delete expired capsules
export function cleanupExpiredCapsules(): number {
  const now = new Date()
  let deleted = 0
  for (const [id, capsule] of capsuleStore) {
    if (capsule.expiresAt && new Date(capsule.expiresAt) < now) {
      capsuleStore.delete(id)
      deleted++
    }
  }
  return deleted
}
