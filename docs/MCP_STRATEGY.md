# MCP Strategy for INTENT

## Why MCP Matters

MCP (Model Context Protocol) is becoming the standard for AI agent tool integration. By 2026, users expect AI apps to connect to their existing tools and services. INTENT must be MCP-ready to:
- Consume tools from external services (calendar, email, notes, task managers)
- Expose its own tools to other AI agents
- Provide a secure, auditable connector system

## What Tools INTENT Might Consum

### Productivity & Organization
- **Calendar** (Google Calendar, Apple Calendar) → Create focus blocks, detect schedule conflicts
- **Reminders** (Apple Reminders, Todoist) → Create comeback reminders, mission follow-ups
- **Notes** (Apple Notes, Notion, Obsidian) → Extract context, create study missions
- **Email** (Gmail, Outlook) → Draft follow-ups, detect urgent obligations

### Communication
- **Slack** → Draft messages, detect work obligations
- **Messages** → Draft texts (never send without confirmation)

### Development
- **GitHub** → Detect open issues, create coding missions
- **Linear** → Extract tasks, create focus blocks

### Learning
- **Learning platforms** (Canvas, Blackboard) → Extract assignments, deadlines
- **PDF readers** → Extract study material

## What Tools INTENT Might Expose

As an MCP server, INTENT could expose:
- **create_micro_mission** → Create a mission from context
- **start_rescue** → Start a rescue flow
- **salvage_session** → Salvage an abandoned session
- **capture_distraction** → Capture a distraction
- **get_momentum_summary** → Get current momentum data
- **get_next_tiny_action** → Get the recommended next action
- **create_comeback_plan** → Create a comeback plan

## Security Risks

### Prompt Injection
- **Risk**: Malicious tool output could inject instructions into the AI
- **Mitigation**: Treat all tool output as untrusted. Sanitize before use in prompts.

### Untrusted Tool Output
- **Risk**: Tool returns could contain harmful content
- **Mitigation**: Validate all output through safety layer before display

### Permission Escalation
- **Risk**: A connected tool could request excessive permissions
- **Mitigation**: Allowlist tools. Require user consent per connector.

### Data Leakage
- **Risk**: Sensitive user data could be sent to external services
- **Mitigation**: Classify all data. Never send restricted data. Require AI consent.

## Permission Architecture

### Connector Permissions
Each MCP connector requires explicit user consent:
- **calendar_read** → Read calendar events
- **calendar_write** → Create calendar events (requires confirmation)
- **email_read** → Read emails
- **email_draft** → Draft emails (never send without confirmation)
- **notes_read** → Read notes
- **reminders_write** → Create reminders

### Tool Call Policy
- **Read-only tools**: Can execute after user intent
- **Write tools**: Require review screen
- **External send tools**: Require explicit confirmation + audit log
- **Delete tools**: Require confirmation + undo option

## Sandboxing Plan

1. **Tool isolation**: Each MCP server runs in its own process
2. **Rate limiting**: Max 10 tool calls per minute per server
3. **Timeout**: Max 5 seconds per tool call
4. **Allowlist**: Only approved MCP servers can connect
5. **Audit logging**: All tool calls are logged with parameters and results

## User-Facing Connector UI

### Connector Settings
- List of connected servers
- Permission status per server
- Disconnect option
- Audit log per server

### Connection Flow
1. User taps "Connect Service"
2. User selects server from allowlist
3. App shows what data will be accessed
4. User grants/revokes individual permissions
5. App stores permission receipt
6. User can revoke anytime

## Implementation Plan

### Phase 1 (Now)
- Tool registry interfaces ✅
- Mock MCP connector
- Security policy doc ✅
- Connector settings UI placeholder
- No dangerous real MCP execution

### Phase 2 (Post-launch)
- Real MCP client implementation
- Calendar connector
- Reminders connector
- Audit logging

### Phase 3 (Future)
- MCP server (expose INTENT tools)
- Third-party connector marketplace
- Advanced sandboxing
