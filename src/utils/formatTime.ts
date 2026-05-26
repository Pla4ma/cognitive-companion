// ══════════════════════════════════════════════════════════════
// Shared time formatting utility
// Formats seconds into MM:SS display string
// ══════════════════════════════════════════════════════════════

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
