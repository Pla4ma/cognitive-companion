# Launch Strategy — INTENT

Go-to-market plan for INTENT — Beat Procrastination.

---

## Timeline Overview

```
Week -2 to -1  │ Pre-launch (TestFlight Beta)
Week 0         │ Launch Week
Week 1-4       │ Post-Launch (Iterate + Grow)
Month 2-3      │ Scale
```

---

## Phase 1: Pre-Launch (2 Weeks Before)

### TestFlight Beta

**Goal:** 100 beta testers, 50+ feedback responses

**Recruitment channels:**
- Reddit r/ADHD (mod-approved post: "I built an app for the 'stuck' feeling — looking for beta testers")
- Twitter/X (personal network + ADHD/productivity creators)
- Discord servers (ADHD communities, indie developer communities)
- Friends/family with ADHD or executive dysfunction

**Beta tester onboarding email:**
```
Subject: You're in — here's how to try INTENT

Hey [name],

Thanks for volunteering your brain for science (sort of).

Here's your TestFlight link: [link]

What to try first:
1. Think of something you're avoiding right now
2. Open INTENT → tap "2-Minute Rescue"
3. Follow the prompts (2 min, max)
4. See if you start the thing

After 3 days, I'd love your feedback: [Typeform link]

No pressure to use it daily. No streaks. That's kind of the point.

— [Founder name]
```

**Feedback form (Typeform/Google Forms):**
1. How many rescue sessions did you complete? (0 / 1-3 / 4-7 / 8+)
2. Did any session help you actually start a task? (Yes / Not sure / No)
3. What felt confusing or broken?
4. What did you wish it did?
5. How did INTENT compare to other productivity apps you've tried?
6. Would you pay $4.99/month for the Pro version? (Yes / Maybe / No)
7. One word to describe INTENT: _____

### Crash Reporting & Analytics

**Tools:**
- **Sentry** — crash reporting, performance monitoring
- **PostHog** — product analytics (self-hostable, privacy-first)
- **RevenueCat** — subscription analytics

**Events to track from day 1:**
```
app_opened
onboarding_started / onboarding_completed
rescue_started / rescue_completed / rescue_abandoned
brain_dump_opened / brain_dump_submitted
before_scroll_shown / before_scroll_actioned / before_scroll_dismissed
body_double_started / body_double_ended
settings_opened
pro_paywall_shown / pro_purchase_started / pro_purchase_completed
```

### Pre-Launch Checklist
- [ ] App Store listing drafted and reviewed
- [ ] Screenshots designed (5 sizes)
- [ ] Preview video recorded
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured (hello@intentapp.com)
- [ ] Landing page live (intentapp.com)
- [ ] TestFlight beta distributed
- [ ] Crash reporting integrated
- [ ] Analytics events firing
- [ ] 100 beta testers recruited
- [ ] Feedback form live
- [ ] App Store submission (review time: 1-3 days)

---

## Phase 2: Launch Week

### Day 1 (Tuesday): Soft Launch

- App goes live on App Store
- Email beta testers: "We're live! Share with a friend who's stuck?"
- Post in personal social media

### Day 2 (Wednesday): Product Hunt

**Tagline:** "The 2-minute rescue for procrastinating brains"

**Description:**
```
INTENT is the anti-productivity app.

No streaks. No guilt. No "just be more disciplined."

When you're stuck — frozen, avoiding, scrolling instead of doing — INTENT gives you a 2-minute rescue: the tiny action that breaks the avoidance loop.

Built by someone with ADHD for brains that resist traditional productivity tools.

Try it the next time you're avoiding something. That's the whole pitch.
```

**Maker comment:**
```
Hey PH 👋

I built INTENT because every productivity app I tried made me feel worse.

Streaks? Broke them. Gamification? Felt patronizing. Timers? Just stressed me out.

The thing that actually works for me is the 2-minute rule — but even that needs a push. INTENT is that push.

It's free to use, privacy-first, and designed for the moment you're stuck (not the moment you're motivated).

Would love your feedback — especially if you have ADHD or struggle with executive dysfunction. This is built for us.
```

**Strategy:**
- Post at 12:01 AM PT (launches are daily)
- Share link in all channels by 8 AM PT
- Respond to every comment within 1 hour
- Target: Top 5 Product of the Day

### Day 3 (Thursday): Reddit

**r/ADHD post:**
```
Title: I built an app for the "I know what to do but I can't start" feeling

Body:
I've tried every productivity app. Forest, Finch, Notion, Todoist, you name it.

They all assume the problem is organization or motivation. For me (and maybe for you), the problem is *starting*. That frozen feeling where you know exactly what to need to do but your brain just... won't.

So I built INTENT. It's simple:
1. You tell it what you're avoiding
2. It gives you a 2-minute intervention (brain dump, micro-task, or body double)
3. You start the smallest possible version of the thing

No streaks. No guilt. No "you missed 3 days!" notifications. It's designed for the moment of stuckness, not the moment of motivation.

It's free and on the App Store: [link]

I'd genuinely love feedback from this community. You're the people I built it for.

[Not affiliated with the mods, just a member who builds things]
```

**r/productivity post:**
```
Title: The anti-productivity app I wish existed sooner

Body:
Most productivity tools work *after* you start. INTENT works *before* you start.

It's a 2-minute rescue for when you're frozen — staring at the task, knowing you should do it, but unable to begin. No guilt, no streaks, no gamification.

Think of it as the ignition, not the engine.

Free on App Store: [link]

Curious if anyone else struggles more with starting than with actually doing the work.
```

### Day 4 (Friday): Twitter/X Thread

```
🧵 I just launched an app called INTENT.

Here's why, and what I learned building it:

1/ Every productivity app assumes you're motivated.
You're not. You're frozen. You're avoiding. You're scrolling Twitter instead of doing the thing.

2/ The actual problem isn't time management or organization.
It's task initiation. The moment between "I should do this" and actually starting.

3/ INTENT gives you a 2-minute rescue in that moment.
Brain dump. Micro-action. Body double. Not motivation — a bypass.

4/ I have ADHD. Every streak-based app made me feel worse.
So INTENT has no streaks. No guilt. No "you missed 3 days!" Just patterns without pressure.

5/ It's free. Core features, forever.
Pro adds AI personalization. But the rescue — the thing that matters — is always free.

6/ If you've ever stared at a task for 45 minutes unable to start, this is for you.

→ [App Store link]

Built with @expo + TypeScript. Open to feedback. 🙏
```

### Day 5-7 (Weekend): Indie Hackers + Follow-up

- Post on Indie Hackers: "How I built an ADHD app in [X] weeks with React Native"
- Share behind-the-scenes: architecture decisions, what I'd do differently
- Respond to all Product Hunt comments
- Post launch metrics update on Twitter

---

## Phase 3: Post-Launch (Weeks 1-4)

### Week 1: Stability + First Feedback
- Monitor crash reports hourly
- Respond to all App Store reviews within 24 hours
- Fix critical bugs within 48 hours
- Send personal thank-you to first 50 users who leave reviews
- Conduct 5 user interviews (15 min each, via Calendly)

### Week 2: Content Marketing
- Publish: "Why Productivity Apps Fail ADHD Brains" (blog/Medium)
- Publish: "The Science of Task Initiation" (blog)
- Guest post on ADHD-focused newsletters
- Reach out to 10 ADHD/productivity YouTubers for review

### Week 3: Iterate
- Ship v1.1 with top 3 user-requested features
- A/B test: onboarding flow (2 variants)
- A/B test: rescue session copy (warm vs. direct tone)
- A/B test: paywall placement (after 3rd session vs. in settings)

### Week 4: Scale
- Launch referral program: "Share INTENT with someone who's stuck"
- Begin ASO iteration based on search data
- Explore partnerships (therapists, ADHD coaches, workplace wellness)

---

## Key Metrics

### Retention Targets

| Metric | Target (Month 1) | Target (Month 3) | Target (Month 6) |
|---|---|---|---|
| D1 Retention | 45% | 50% | 55% |
| D7 Retention | 25% | 30% | 35% |
| D30 Retention | 12% | 18% | 22% |

**Benchmark context:**
- Average productivity app D1: 35%, D7: 15%, D30: 6%
- Top-quartile productivity app D1: 50%, D7: 25%, D30: 15%
- INTENT target = top-quartile by month 6

### Activation Metrics

| Metric | Definition | Target |
|---|---|---|
| Activation Rate | % of new users who complete 1 rescue session | 60% |
| Time to First Rescue | Median time from install to first session | < 3 minutes |
| Sessions/Week | Avg rescue sessions per weekly active user | 4+ |
| Brain Dump Usage | % of users who use brain dump in first week | 35% |
| Before-Scroll Engagement | % who action (not dismiss) before-scroll prompts | 25% |

### Business Metrics

| Metric | Target (Month 1) | Target (Month 3) | Target (Month 6) |
|---|---|---|---|
| Pro Conversion | 3% | 5% | 8% |
| App Store Rating | 4.5+ | 4.6+ | 4.7+ |
| Crash-Free Rate | 99.5% | 99.7% | 99.9% |
| Monthly Revenue | $500 | $2,500 | $10,000 |
| MAU | 1,000 | 8,000 | 25,000 |

### North Star Metric
**Weekly Rescue Completion Rate** — % of active users who complete ≥1 rescue session per week. This measures the core loop working. Target: 70%.

---

## Competitive Positioning

### Market Map

```
                    High Structure
                         │
         Forest ●        │        ● Opal
                         │
    ─────────────────────────────────────
    Passive              │              Active
    Intervention         │         Intervention
                         │
         Finch ●         │        ● INTENT
                         │
                    Low Structure
```

### Competitive Analysis

| Feature | INTENT | Finch | One Sec | ClearSpace | Forest | Opal |
|---|---|---|---|---|---|---|
| Addresses task initiation | ✅ Core | ❌ | ❌ | ❌ | ❌ | ❌ |
| ADHD-specific design | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| No streaks/no guilt | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Brain dump feature | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Body double sessions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Scroll intervention | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| AI-powered rescue | ✅ Pro | ❌ | ❌ | ❌ | ❌ | ❌ |
| Free core features | ✅ | Freemium | Freemium | Freemium | Paid | Freemium |
| Works offline | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Privacy-first | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

### Key Differentiators (What NO ONE Else Does)

**1. The 2-Minute Rescue Protocol**
No other app has a structured, science-backed intervention specifically for the moment of stuckness. One Sec adds friction to apps. ClearSpace blocks them. INTENT *meets you in the freeze* and walks you out of it.

**2. Task Initiation as a First-Class Problem**
Every other app solves "how to organize" or "how to focus." INTENT solves "how to start." This is the actual bottleneck for 80% of procrastination, and no app addresses it directly.

**3. Anti-Streak Architecture**
Finch gamifies with streaks. Forest penalizes you for leaving. INTENT explicitly has no streaks, no penalties, no guilt mechanics. This is a deliberate design choice for brains that shut down under pressure.

**4. Brain Dump → Action Pipeline**
Brain dumps exist in journaling apps (Day One, Notion). Action lists exist in task managers (Todoist, Things). INTENT connects them: dump your mental clutter → get a prioritized micro-action → start in 2 minutes. The pipeline is the product.

**5. Before-Scroll Intervention**
One Sec and ClearSpace add friction to social media. INTENT intercepts the *moment of avoidance* — when you reach for your phone to procrastinate — and offers an alternative. It's not blocking. It's redirecting. The psychology is fundamentally different.

---

## Content Marketing Calendar (Month 1-3)

### Blog Posts
1. "Why Productivity Apps Fail ADHD Brains" (launch week)
2. "The Science of Task Initiation: Why Starting Is the Hardest Part" (week 2)
3. "I Broke My Streak on Purpose: The Case Against Gamification" (week 3)
4. "Body Doubling Explained: Why Working 'With' Someone Helps" (week 4)
5. "2-Minute Rule: The Science Behind INTENT's Core Feature" (week 5)
6. "Executive Dysfunction Isn't Laziness: A Guide for Non-ADHD Partners" (week 6)
7. "How I Built an App That Doesn't Want You to Use It" (week 7)
8. "The Avoidance Loop: Understanding Procrastination's Real Mechanism" (week 8)
9. "INTENT User Stories: Real People, Real Rescue Sessions" (week 9)
10. "What 10,000 Rescue Sessions Taught Us About Starting" (week 10)

### Newsletter (Biweekly)
- Behind-the-scenes of building INTENT
- User stories (anonymized)
- Product updates
- ADHD/procrastination research highlights

---

## Partnerships

### Target Partners
- **ADHD coaches** — offer free Pro accounts, ask for referrals
- **Therapists** — position INTENT as a between-sessions tool
- **Workplace wellness programs** — B2B angle for Q3
- **Universities** — student disability services
- **ADHD newsletters** — paid sponsorships (ADHD Alien, How to ADHD)

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Low D1 retention | Medium | High | Optimize onboarding (A/B test) |
| App Store rejection | Low | High | Follow guidelines strictly, have appeal ready |
| Negative reviews (buggy) | Medium | High | Beta test thoroughly, rapid hotfix pipeline |
| Low Pro conversion | Medium | Medium | Adjust paywall timing, add value to Pro |
| Copycat apps | Low (short-term) | Low | Build brand + community moat |
| AI costs too high | Medium | Medium | Cache common responses, rate-limit free tier |

---

*Last updated: May 2026*
