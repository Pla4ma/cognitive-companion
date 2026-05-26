# INTENT — Backend Strategy

## Local-First, Cloud-Later Architecture

### What Stays Local Forever
- Mission content and exact actions
- State labels (overwhelmed, anxious, etc.)
- Context capsule raw text
- Brain dumps
- Distraction captures
- Personal drift graph
- Playbook rules
- Safety engine decisions
- Consent ledger
- Privacy settings

### What Can Sync (with encryption)
- Mission metadata (title, duration, outcome)
- Momentum scores
- Weekly story summaries
- Agent run traces (anonymized)
- Playbook confidence scores
- Account preferences

### What Needs Encryption
- Context capsule summaries
- Mission threads
- Open loops
- Accountability pact data
- Handoff drafts (email/message)

### What Can Go to Analytics (minimal, anonymized)
- Feature usage counts
- Time-to-action metrics
- Outcome distributions
- Protocol success rates
- Crash reports
- Performance metrics

### What Remote AI Can Use (only if permitted)
- Aggregated mission patterns
- Context capsule summaries (not raw text)
- Protocol effectiveness data
- Weekly story generation inputs

---

## Account Creation Timing

**Day 0**: No account required. Full rescue experience available locally.

**Day 3-7**: Optional account prompt after experiencing value. "Save your progress across devices?"

**Premium**: Account required for subscription. Sync enabled by entitlement.

---

## Supabase Schema

```sql
-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  privacy_level TEXT DEFAULT 'local',
  subscription_tier TEXT DEFAULT 'free'
);

-- Missions (metadata only)
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  protocol_id TEXT,
  duration INTEGER,
  category TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Moments (drift signals)
CREATE TABLE moments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  state TEXT,
  energy TEXT,
  available_time INTEGER,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context Capsules (encrypted summaries)
CREATE TABLE context_capsules (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  summary_encrypted TEXT,
  sensitivity_level TEXT,
  extracted_actions JSONB,
  allow_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Agent Runs (traces)
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trigger TEXT,
  steps JSONB,
  selected_protocol TEXT,
  used_remote_ai BOOLEAN DEFAULT FALSE,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission Receipts
CREATE TABLE permission_receipts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted BOOLEAN,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Subscription Entitlements
CREATE TABLE subscription_entitlements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  provider TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Items
CREATE TABLE memory_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_encrypted TEXT,
  type TEXT,
  confidence REAL,
  allow_remote BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

---

## Row Level Security

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;

-- All tables: user can only access their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Similar policies for all tables...
```

---

## Edge Functions

1. **weekly-story-generator**: Aggregates mission data into weekly narrative
2. **protocol-effectiveness**: Analyzes protocol success rates across anonymized data
3. **subscription-entitlement**: Validates and updates subscription status
4. **data-export**: Generates user data export
5. **data-deletion**: Cascading deletion of all user data

---

## Security Rules

- RLS on every table
- user_id enforced at database level
- No public reads
- No service role in client
- Encrypted sensitive fields
- Deletion cascade
- Audit logs for all data access

---

## Offline-First Strategy

1. All reads from local cache first
2. Writes go to local, sync to cloud async
3. Conflict resolution: last-write-wins for metadata, manual merge for content
4. Queue sync operations when offline
5. Retry with exponential backoff
6. Never block UI on sync

---

## Data Export Format

```json
{
  "exported_at": "2026-05-25T00:00:00Z",
  "missions": [...],
  "moments": [...],
  "context_capsules": [...],
  "memory_items": [...],
  "playbook_rules": [...],
  "attention_receipts": [...]
}
```

---

## Data Deletion

- Profile deleted → all tables cascade delete
- Local data cleared on logout
- Cloud data deleted within 30 days of account deletion
- Confirmation required: "This will permanently delete all your data"
