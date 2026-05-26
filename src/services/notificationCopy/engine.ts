// ── Notification Copy Engine ────────────────────────────────
// Generates, validates, and sanitizes notification copy

export interface NotificationRequest {
  category: 'rescue' | 'celebrate' | 'nudge' | 'check_in';
  state: string | null;
  style: 'gentle' | 'direct' | 'playful';
  privacyMode: 'safe' | 'detailed';
  recentDismissals: number;
  cooldownActive: boolean;
}

export interface NotificationResult {
  shouldSend: boolean;
  title: string;
  body: string;
  suppressReason?: string;
}

// Copy templates by category and style
const COPY_TEMPLATES: Record<string, Record<string, string[]>> = {
  rescue: {
    gentle: [
      'Tiny restart available — 2 minutes to feel lighter.',
      'A small step is waiting. No pressure.',
      'One tiny action could shift everything.',
    ],
    direct: [
      'Ready for a quick restart?',
      'Pick one small thing. Start there.',
    ],
    playful: [
      'Psst — your 2-minute rescue is here ✨',
    ],
  },
  celebrate: {
    gentle: [
      'You did a thing! That matters.',
      'Progress, not perfection. Well done.',
    ],
    direct: [
      'Milestone reached. Keep going.',
    ],
    playful: [
      'Look at you winning 🎉',
    ],
  },
  nudge: {
    gentle: [
      'Your mission is still here when you\'re ready.',
      'No rush — just a gentle reminder.',
    ],
    direct: [
      'You have a pending mission.',
    ],
    playful: [
      'Your mission misses you 💛',
    ],
  },
  check_in: {
    gentle: [
      'How are you doing? Just checking in.',
    ],
    direct: [
      'Quick check-in — how\'s it going?',
    ],
    playful: [
      'Hey! Just making sure you\'re okay 👋',
    ],
  },
};

const UNSAFE_PATTERNS = [
  'avoiding your work',
  'you are lazy',
  'you should be ashamed',
  'you\'re not trying',
  'you\'re wasting time',
  'get your act together',
  'what\'s wrong with you',
  'you never finish',
  'you always quit',
  'stop procrastinating',
];

const UNSAFE_WORDS = ['avoiding', 'lazy', 'ashamed', 'procrastinating', 'wasting'];

export function generateNotificationCopy(req: NotificationRequest): NotificationResult {
  // Suppress after too many dismissals
  if (req.recentDismissals >= 3) {
    return {
      shouldSend: false,
      title: '',
      body: '',
      suppressReason: 'too_many_dismissals',
    };
  }

  // Suppress during cooldown
  if (req.cooldownActive) {
    return {
      shouldSend: false,
      title: '',
      body: '',
      suppressReason: 'cooldown_active',
    };
  }

  const categoryTemplates = COPY_TEMPLATES[req.category] || COPY_TEMPLATES.rescue;
  const styleTemplates = categoryTemplates[req.style] || categoryTemplates.gentle;

  // Pick a random template
  const body = styleTemplates[Math.floor(Math.random() * styleTemplates.length)] || 'Tiny step available.';

  // Sanitize if needed
  const safeBody = req.privacyMode === 'safe' ? sanitizeCopy(body) : body;

  return {
    shouldSend: true,
    title: req.category === 'rescue' ? 'Rescue' : req.category === 'celebrate' ? 'Nice work' : 'Reminder',
    body: safeBody,
  };
}

export function isUnsafeCopy(text: string): boolean {
  const lower = text.toLowerCase();
  return UNSAFE_PATTERNS.some(pattern => lower.includes(pattern));
}

export function sanitizeCopy(text: string): string {
  let sanitized = text;
  for (const word of UNSAFE_WORDS) {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '');
  }
  // Clean up double spaces
  sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();
  return sanitized;
}
