// ══════════════════════════════════════════════════════════════
// INTENT — Demo Data Mode
// Seeded data for App Store screenshots and QA
// ══════════════════════════════════════════════════════════════

export interface DemoScenario {
  id: string
  name: string
  description: string
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  { id: 'essay', name: 'Avoiding essay', description: 'User avoiding English essay, overwhelmed, 5 min available' },
  { id: 'exam', name: 'Biology exam', description: 'User studying for exam, stuck, needs flashcards' },
  { id: 'scroll', name: 'Before You Scroll', description: 'User about to doomscroll, offered 2-min win' },
  { id: 'cleaning', name: 'Cleaning reset', description: 'User overwhelmed by messy room, 2-min basket challenge' },
  { id: 'planning_loop', name: 'Planning loop', description: 'User editing missions without starting, offered breaker' },
  { id: 'salvaged', name: 'Salvaged mission', description: 'User started but got distracted, salvaged something' },
  { id: 'calendar', name: 'Calendar follow-up', description: 'User has deadline, handoff creates reminder' },
  { id: 'privacy', name: 'Privacy local mode', description: 'Trust center showing local-only badge' },
]

// ── Demo Data Generators ───────────────────────────────────

export function getDemoMission(scenarioId: string): { title: string; exactAction: string; duration: number } {
  const missions: Record<string, { title: string; exactAction: string; duration: number }> = {
    essay: { title: 'Write one ugly sentence', exactAction: 'Open your essay doc and write the worst first sentence you can', duration: 5 },
    exam: { title: 'Make 3 flashcards', exactAction: 'Open your biology notes and make 3 flashcards from the first chapter', duration: 5 },
    scroll: { title: 'One tiny win first', exactAction: 'Do one 2-minute productive action before you scroll', duration: 2 },
    cleaning: { title: '10 items in basket', exactAction: 'Put 10 items from your floor into one basket', duration: 2 },
    planning_loop: { title: 'Start anything for 2 min', exactAction: 'Stop planning. Start the first thing you can think of.', duration: 2 },
    salvaged: { title: 'Read what you wrote', exactAction: 'Open the doc and read your last paragraph', duration: 2 },
    calendar: { title: 'Open the assignment', exactAction: 'Find the assignment and read the due date', duration: 2 },
    privacy: { title: 'Open notes', exactAction: 'Open your notes and read for 2 minutes', duration: 2 },
  }
  return missions[scenarioId] ?? missions.essay
}

export function getDemoDriftInsight(scenarioId: string): string {
  const insights: Record<string, string> = {
    essay: 'You tend to avoid writing tasks after 8 PM. Morning starts work better for you.',
    exam: 'Flashcards work better for you than reading notes. 5-minute sessions have highest completion.',
    scroll: 'You have avoided doomscroll 4 times this week with Before You Scroll.',
    cleaning: 'Physical tasks have 80% completion rate when you start with 2 minutes.',
    planning_loop: 'You edit missions 3x more than you start them. Starting ugly works.',
    salvaged: 'You come back after distraction 60% of the time. That is strong recovery.',
    calendar: 'Deadline tasks get done when you break them into 3-step chains.',
    privacy: 'Your data stays on your device. No remote AI used.',
  }
  return insights[scenarioId] ?? insights.essay
}

// ── Demo Mode State ────────────────────────────────────────

let demoModeEnabled = false

export function isDemoMode(): boolean {
  return demoModeEnabled
}

export function enableDemoMode(): void {
  demoModeEnabled = true
}

export function disableDemoMode(): void {
  demoModeEnabled = false
}

export function getDemoModeWarning(): string {
  return 'Demo mode active — showing sample data'
}
