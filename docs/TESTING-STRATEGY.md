# Testing Strategy — INTENT

Comprehensive testing plan for INTENT — Beat Procrastination.

---

## Current Status

| Category | Status |
|---|---|
| Unit Tests | 416/416 passing ✅ |
| Integration Tests | Covered via unit test suite ✅ |
| Visual Regression | ❌ Not implemented |
| E2E Tests | ❌ Not implemented |
| Performance Regression | ❌ Not implemented |
| Accessibility Audit | ❌ Not implemented |
| Crash-Free Rate (beta) | 99.5% (Sentry) |

---

## Test Pyramid

```
        ╱╲
       ╱  ╲         E2E Tests (15-20 scenarios)
      ╱    ╲        Slow, high confidence
     ╱──────╲
    ╱        ╲      Integration Tests (~80)
   ╱          ╲     Medium speed, medium confidence
  ╱────────────╲
 ╱              ╲   Unit Tests (~416)
╱                ╲  Fast, high coverage
╱──────────────────╲
```

---

## E2E Test Scenarios (Detox / Maestro)

### Tool Choice
**Primary:** Maestro (simpler YAML syntax, better for React Native/Expo)
**Backup:** Detox (if Maestro lacks needed assertions)

### Test Suite 1: Onboarding Flow

```yaml
# e2e/onboarding.yaml
appId: com.intent.app
---
- launchApp
- assertVisible: "Your brain knows what to do"
- tapOn: "Get Started"
- assertVisible: "What are you avoiding right now?"
- inputText: "Clean my apartment"
- tapOn: "Continue"
- assertVisible: "Welcome to INTENT"
- tapOn: "Start my first rescue"
- assertVisible: "2-Minute Rescue"
```

### Test Suite 2: Rescue Session

```yaml
# e2e/rescue-session.yaml
appId: com.intent.app
---
- launchApp
- tapOn: "2-Minute Rescue"
- assertVisible: "What are you avoiding?"
- inputText: "Write that email"
- tapOn: "Start Rescue"
- assertVisible: "Step 1"
- tapOn: "Done"
- assertVisible: "Step 2"
- tapOn: "Done"
- assertVisible: "You started"
- assertVisible: "How did that feel?"
```

### Test Suite 3: Brain Dump

```yaml
# e2e/brain-dump.yaml
appId: com.intent.app
---
- launchApp
- tapOn: "Brain Dump"
- assertVisible: "Dump everything in your head"
- inputText: "Call dentist, buy groceries, finish report"
- tapOn: "Capture"
- assertVisible: "Call dentist"
- assertVisible: "Buy groceries"
- assertVisible: "Finish report"
- tapOn: "Pick one to start"
- assertVisible: "2-Minute Rescue"
```

### Test Suite 4: Before-Scroll

```yaml
# e2e/before-scroll.yaml
appId: com.intent.app
---
- launchApp
- openLink: "instagram://"  # Triggers before-scroll
- assertVisible: "Before you scroll"
- assertVisible: "Is there a 2-minute task?"
- tapOn: "Quick rescue"
- assertVisible: "2-Minute Rescue"
# OR
- tapOn: "Just scrolling"
- assertNotVisible: "2-Minute Rescue"  # Dismissed gracefully
```

### Test Suite 5: Settings & Preferences

```yaml
# e2e/settings.yaml
appId: com.intent.app
---
- launchApp
- tapOn: "Settings"
- toggleOn: "Before-Scroll alerts"
- assertVisible: "Enabled"
- tapOn: "Notification schedule"
- selectTime: "09:00"
- tapOn: "Save"
- assertVisible: "Saved"
```

### Test Suite 6: Offline Mode

```yaml
# e2e/offline.yaml
appId: com.intent.app
---
- launchApp
- disableNetwork
- tapOn: "2-Minute Rescue"
- assertVisible: "What are you avoiding?"
- inputText: "Test offline"
- tapOn: "Start Rescue"
- assertVisible: "Step 1"  # Works offline
- enableNetwork
```

---

## Performance Benchmarks

### Cold Start
**Target:** < 2 seconds from tap to interactive
**Measurement:** `performance.now()` at app entry → first meaningful paint
**CI gate:** Fail if cold start > 2.5s on iPhone 12 simulator

```typescript
// __tests__/performance/cold-start.test.ts
describe('Cold Start Performance', () => {
  it('renders first screen within 2 seconds', async () => {
    const start = performance.now();
    render(<App />);
    await waitFor(() => expect(screen.getByText('2-Minute Rescue')).toBeTruthy());
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
```

### Render Performance
**Target:** < 16ms per frame (60fps)
**Measurement:** React DevTools Profiler + custom marks
**CI gate:** Fail if any component re-renders > 3 times on mount

```typescript
// __tests__/performance/render.test.ts
describe('Render Performance', () => {
  it('RescueScreen renders within 16ms budget', () => {
    const { renderTime } = profileRender(<RescueScreen />);
    expect(renderTime).toBeLessThan(16);
  });

  it('BrainDumpScreen does not exceed 3 re-renders on mount', () => {
    const { renderCount } = countRenders(<BrainDumpScreen />);
    expect(renderCount).toBeLessThanOrEqual(3);
  });
});
```

### Store Update Performance
**Target:** < 8ms for any single store update
**Measurement:** Zustand `subscribe` timing

```typescript
// __tests__/performance/store.test.ts
describe('Store Performance', () => {
  it('rescue state update completes within 8ms', () => {
    const start = performance.now();
    useRescueStore.getState().startRescue({ task: 'test' });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(8);
  });
});
```

### AI First Token Latency
**Target:** < 1.5 seconds
**Measurement:** Time from request to first streamed token
**CI gate:** Fail if p95 > 2.0s (mock-based testing)

```typescript
// __tests__/performance/ai-latency.test.ts
describe('AI Performance', () => {
  it('first token arrives within 1.5 seconds', async () => {
    const start = performance.now();
    const stream = await aiService.getRescueSuggestion({ task: 'test' });
    const firstToken = await stream.next();
    const latency = performance.now() - start;
    expect(latency).toBeLessThan(1500);
  });
});
```

### Performance Regression CI

```yaml
# .github/workflows/performance.yml
name: Performance Regression
on: [pull_request]
jobs:
  perf:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:performance -- --ci
      - name: Compare with baseline
        run: npx tsx scripts/compare-perf.ts
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              body: '⚠️ Performance regression detected. See workflow logs.'
            });
```

---

## Accessibility Audit Checklist

### Screen Reader (VoiceOver / TalkBack)

- [ ] All interactive elements have `accessibilityLabel`
- [ ] All images have `accessibilityLabel` (or are marked decorative)
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Focus order follows visual layout (left-to-right, top-to-bottom)
- [ ] Modal dialogs trap focus correctly
- [ ] Dynamic content changes are announced (`accessibilityLiveRegion`)
- [ ] Custom gestures have alternatives
- [ ] Timer announces remaining time periodically

### Visual

- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Large text contrast ratio ≥ 3:1 (WCAG AA, 18pt+)
- [ ] Color is not the only way to convey information
- [ ] UI scales to 200% text size without clipping
- [ ] Focus indicators are visible (keyboard/switch control)
- [ ] Animations respect `prefers-reduced-motion`

### Motor

- [ ] All tap targets ≥ 44×44 points
- [ ] No time-dependent interactions without extension
- [ ] Swipe gestures have button alternatives
- [ ] App works with Switch Control
- [ ] App works with Voice Control (iOS)

### Cognitive

- [ ] Clear, simple language (Flesch-Kincaid grade 8 or below)
- [ ] Consistent navigation patterns
- [ ] Error messages are helpful, not cryptic
- [ ] No flashing content (seizure risk)
- [ ] Predictable behavior on all interactions

### Testing Tools

| Tool | Purpose | Frequency |
|---|---|---|
| **axe-core** (via jest-axe) | Automated a11y checks in unit tests | Every PR |
| **Accessibility Inspector** (Xcode) | Visual audit of component tree | Weekly |
| **VoiceOver** (manual) | Real screen reader testing | Before each release |
| **TalkBack** (manual) | Android screen reader testing | Before each release |
| **Lighthouse** | Web version accessibility score | Monthly |
| **Color Oracle** | Color blindness simulation | Design review |

### Automated Accessibility Tests

```typescript
// __tests__/accessibility/rescue-screen.test.tsx
import { render } from '@testing-library/react-native';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('RescueScreen Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<RescueScreen />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('all buttons have accessibility labels', () => {
    render(<RescueScreen />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.props.accessibilityLabel).toBeDefined();
      expect(button.props.accessibilityLabel.length).toBeGreaterThan(0);
    });
  });

  it('timer announces time for screen readers', () => {
    render(<RescueTimer duration={120} />);
    const timer = screen.getByTestId('rescue-timer');
    expect(timer.props.accessibilityLiveRegion).toBe('polite');
  });
});
```

---

## Visual Regression Testing

### Tool: **Percy** or **Chromatic** (Storybook-based)

### Key Screens to Snapshot

| Screen | Variants | Notes |
|---|---|---|
| Home (empty state) | Light, Dark | First-launch state |
| Home (with history) | Light, Dark | Returning user |
| Rescue session (step 1) | Light, Dark | Active intervention |
| Rescue session (complete) | Light, Dark | Celebration state |
| Brain dump (input) | Light, Dark | Text entry state |
| Brain dump (results) | Light, Dark | After capture |
| Before-scroll overlay | Light, Dark | Interruption state |
| Settings | Light, Dark | Full settings list |
| Paywall | Light, Dark | Pro upsell |
| Onboarding (step 1-4) | Light, Dark | All onboarding screens |

### CI Integration

```yaml
# .github/workflows/visual.yml
name: Visual Regression
on: [pull_request]
jobs:
  visual:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx storybook build
      - run: npx percy storybook ./storybook-static
```

---

## Test Data Strategy

### Factories

```typescript
// __tests__/factories/user.factory.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  createdAt: new Date('2026-01-01'),
  rescueCount: 5,
  proStatus: 'free',
  preferences: {
    notifications: true,
    beforeScroll: true,
    darkMode: 'system',
  },
  ...overrides,
});

export const createMockRescue = (overrides?: Partial<Rescue>): Rescue => ({
  id: 'rescue-456',
  userId: 'user-123',
  task: 'Write that email',
  startedAt: new Date(),
  completedAt: null,
  steps: [
    { id: '1', text: 'Open your email app', completed: false },
    { id: '2', text: 'Type the subject line', completed: false },
    { id: '3', text: 'Write the first sentence', completed: false },
  ],
  ...overrides,
});
```

---

## Test Coverage Targets

| Module | Current | Target |
|---|---|---|
| Stores (Zustand) | ~90% | 95% |
| Hooks | ~85% | 90% |
| Components | ~80% | 85% |
| Services | ~75% | 85% |
| Utilities | ~95% | 98% |
| **Overall** | **~82%** | **90%** |

---

## CI/CD Pipeline

```
PR Created
  → Lint (ESLint + Prettier)
  → Type check (tsc --noEmit)
  → Unit tests (Jest, 416+ tests)
  → Accessibility tests (jest-axe)
  → Performance benchmarks
  → Visual regression (Percy)
  → E2E smoke tests (Maestro, 4 critical paths)
  → Build (Expo EAS)
  → Merge to main

Main Branch
  → Full E2E suite (Maestro, all scenarios)
  → Build + submit to TestFlight
  → Staged rollout (10% → 50% → 100%)
```

---

*Last updated: May 2026*
