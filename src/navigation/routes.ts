// ══════════════════════════════════════════════════════════════
// INTENT — Navigation Architecture
// 3 primary modes: Rescue / Playbook / Vault
// ══════════════════════════════════════════════════════════════

export type PrimaryTab = 'rescue' | 'playbook' | 'vault'

export interface NavRoute {
  name: string
  tab: PrimaryTab
  requiresAuth: boolean
  deepLinkable: boolean
}

// ── Route Definitions ──────────────────────────────────────

export const ROUTES: Record<string, NavRoute> = {
  // Rescue tab
  rescue_home: { name: 'Rescue', tab: 'rescue', requiresAuth: false, deepLinkable: true },
  emergency_start: { name: 'Emergency Start', tab: 'rescue', requiresAuth: false, deepLinkable: true },
  state_select: { name: 'Select State', tab: 'rescue', requiresAuth: false, deepLinkable: false },
  before_scroll: { name: 'Before You Scroll', tab: 'rescue', requiresAuth: false, deepLinkable: true },
  live_mission: { name: 'Live Mission', tab: 'rescue', requiresAuth: false, deepLinkable: true },
  salvage: { name: 'Salvage', tab: 'rescue', requiresAuth: false, deepLinkable: true },
  body_double: { name: 'Body Double', tab: 'rescue', requiresAuth: false, deepLinkable: true },
  mission_chain: { name: 'Mission Chain', tab: 'rescue', requiresAuth: false, deepLinkable: false },
  system_rescue_entry: { name: 'System Rescue', tab: 'rescue', requiresAuth: false, deepLinkable: true },

  // Playbook tab
  playbook_home: { name: 'Playbook', tab: 'playbook', requiresAuth: false, deepLinkable: false },
  momentum: { name: 'Momentum', tab: 'playbook', requiresAuth: false, deepLinkable: false },
  drift_graph: { name: 'Drift Graph', tab: 'playbook', requiresAuth: false, deepLinkable: false },
  weekly_story: { name: 'Weekly Story', tab: 'playbook', requiresAuth: false, deepLinkable: false },
  experiments: { name: 'Experiments', tab: 'playbook', requiresAuth: false, deepLinkable: false },
  drift_mirror: { name: 'Drift Mirror', tab: 'playbook', requiresAuth: false, deepLinkable: false },

  // Vault tab
  vault_home: { name: 'Vault', tab: 'vault', requiresAuth: false, deepLinkable: false },
  context_inbox: { name: 'Context Inbox', tab: 'vault', requiresAuth: false, deepLinkable: true },
  mission_threads: { name: 'Mission Threads', tab: 'vault', requiresAuth: false, deepLinkable: false },
  open_loops: { name: 'Open Loops', tab: 'vault', requiresAuth: false, deepLinkable: false },
  trust_center: { name: 'Trust Center', tab: 'vault', requiresAuth: false, deepLinkable: false },
  memory_controls: { name: 'Memory', tab: 'vault', requiresAuth: false, deepLinkable: false },
  action_handoffs: { name: 'Action Handoffs', tab: 'vault', requiresAuth: false, deepLinkable: false },
  settings: { name: 'Settings', tab: 'vault', requiresAuth: false, deepLinkable: false },

  // Contextual (not in tabs)
  coach: { name: 'Coach', tab: 'rescue', requiresAuth: false, deepLinkable: false },
  ambient_settings: { name: 'Ambient Settings', tab: 'vault', requiresAuth: false, deepLinkable: false },
  accountability: { name: 'Accountability', tab: 'vault', requiresAuth: false, deepLinkable: false },
}

// ── Tab Configuration ──────────────────────────────────────

export interface TabConfig {
  id: PrimaryTab
  label: string
  icon: string
  description: string
}

export const TAB_CONFIG: TabConfig[] = [
  {
    id: 'rescue',
    label: 'Rescue',
    icon: '⚡',
    description: 'Start a rescue mission, Before You Scroll, or Body Double',
  },
  {
    id: 'playbook',
    label: 'Playbook',
    icon: '📖',
    description: 'Your patterns, momentum, and drift insights',
  },
  {
    id: 'vault',
    label: 'Vault',
    icon: '🔒',
    description: 'Context, threads, memory, and data controls',
  },
]

// ── Route Helpers ──────────────────────────────────────────

export function getRoute(name: string): NavRoute | null {
  return ROUTES[name] ?? null
}

export function getRoutesForTab(tab: PrimaryTab): NavRoute[] {
  return Object.values(ROUTES).filter((r) => r.tab === tab)
}

export function getDeepLinkableRoutes(): NavRoute[] {
  return Object.values(ROUTES).filter((r) => r.deepLinkable)
}
