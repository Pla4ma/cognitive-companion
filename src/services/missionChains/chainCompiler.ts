// ── Mission Chain Compiler ──────────────────────────────────
// Compiles multi-step mission chains from templates

export interface ChainStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  duration: number; // minutes
}

export interface MissionChain {
  id: string;
  title: string;
  chainType: string;
  steps: ChainStep[];
  currentStep: number;
  createdAt: number;
}

// Pre-defined step templates per chain type
const CHAIN_TEMPLATES: Record<string, (title: string) => ChainStep[]> = {
  school_assignment: (title) => [
    { id: 'step_1', title: 'Open materials', description: `Open your ${title} materials`, status: 'active', duration: 2 },
    { id: 'step_2', title: 'Draft outline', description: 'Write a rough outline of key points', status: 'pending', duration: 5 },
    { id: 'step_3', title: 'Write first paragraph', description: 'Get one paragraph down — ugly is fine', status: 'pending', duration: 10 },
    { id: 'step_4', title: 'Review and submit', description: 'Quick review, then turn it in', status: 'pending', duration: 5 },
  ],
  cleaning: (title) => [
    { id: 'step_1', title: 'Clear visible surface', description: `Clear one visible surface in ${title || 'your space'}`, status: 'active', duration: 3 },
    { id: 'step_2', title: 'Sort into piles', description: 'Trash, keep, relocate — three piles', status: 'pending', duration: 5 },
    { id: 'step_3', title: 'Put away keeps', description: 'Put the "keep" pile where it belongs', status: 'pending', duration: 5 },
  ],
  life_admin: (title) => [
    { id: 'step_1', title: 'Find the thing', description: `Locate what you need for ${title}`, status: 'active', duration: 2 },
    { id: 'step_2', title: 'Do the thing', description: 'Complete the core task', status: 'pending', duration: 10 },
    { id: 'step_3', title: 'Confirm done', description: 'Verify and mark complete', status: 'pending', duration: 2 },
  ],
  creative: (title) => [
    { id: 'step_1', title: 'Gather inspiration', description: `Spend 2 minutes gathering ideas for ${title}`, status: 'active', duration: 2 },
    { id: 'step_2', title: 'Create rough draft', description: 'Make something imperfect', status: 'pending', duration: 10 },
    { id: 'step_3', title: 'One improvement', description: 'Make one improvement to what you created', status: 'pending', duration: 5 },
  ],
};

export function compileMissionChain(title: string, chainType: string): MissionChain {
  const templateFn = CHAIN_TEMPLATES[chainType] || CHAIN_TEMPLATES.life_admin;
  const steps = templateFn(title);

  return {
    id: `chain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    chainType,
    steps,
    currentStep: 0,
    createdAt: Date.now(),
  };
}

export function advanceChain(chain: MissionChain): MissionChain {
  const updatedSteps = chain.steps.map((step, i) => {
    if (i === chain.currentStep) {
      return { ...step, status: 'completed' as const };
    }
    if (i === chain.currentStep + 1) {
      return { ...step, status: 'active' as const };
    }
    return step;
  });

  return {
    ...chain,
    steps: updatedSteps,
    currentStep: chain.currentStep + 1,
  };
}

export function getCurrentStep(chain: MissionChain): ChainStep | null {
  if (chain.currentStep >= chain.steps.length) {
    return null;
  }
  return chain.steps[chain.currentStep] ?? null;
}

export function isChainComplete(chain: MissionChain): boolean {
  return chain.steps.every(step => step.status === 'completed' || step.status === 'skipped');
}
