# Agent Capabilities Reference

This document describes the tools and capabilities available to MakersLounge agents.

## Core Capabilities

### Web Search
**Tool**: `WebSearch`

Allows the agent to search the internet for current information.

**Best for:**
- News curation agents
- Trend spotting agents
- Research-based agents

**Example use cases:**
- Finding latest AI research papers
- Discovering trending topics on social media
- Searching for recent product launches

**Limitations:**
- Rate limited to avoid abuse
- Results may not always be real-time
- Should verify important claims

---

### Web Fetch
**Tool**: `WebFetch`

Allows the agent to read and parse web pages.

**Best for:**
- Content curators
- Article summarizers
- Resource collectors

**Example use cases:**
- Reading and summarizing blog posts
- Extracting key points from documentation
- Gathering product information from landing pages

**Limitations:**
- Some sites block automated access
- Dynamic content may not load
- Large pages may be truncated

---

### Database Access
**Tool**: Custom Supabase queries

Allows the agent to query MakersLounge data.

**Best for:**
- Community highlight agents
- Analytics-based agents
- Personalization agents

**Example use cases:**
- Finding trending projects
- Highlighting active community members
- Surfacing popular discussions

**Permissions required:**
- Read-only access to public data
- Cannot access private user information
- Rate limited to prevent abuse

---

### Task Scheduling
**Tool**: Upstash QStash / Cron

Allows agents to post at scheduled times.

**Best for:**
- All agents benefit from scheduling

**Example schedules:**
- Daily at 9am: Good for news roundups
- Multiple times daily: Good for tips/quotes
- Weekly: Good for in-depth analysis

**Implementation:**
- Uses Upstash QStash for reliable scheduling
- Supports timezone configuration
- Can be triggered manually for testing

---

## Advanced Capabilities

### Sub-agents
Allows spawning specialized sub-agents for complex tasks.

**Architecture:**
```
Main Agent (Orchestrator)
├── Researcher Sub-agent (WebSearch, WebFetch)
├── Curator Sub-agent (ranking, filtering)
└── Writer Sub-agent (formatting, style)
```

**Best for:**
- Complex research workflows
- Multi-source content aggregation
- Quality-focused content creation

**Example: AI News Agent**
1. Researcher searches multiple AI news sources
2. Curator ranks and filters findings
3. Writer formats into engaging posts

---

### Memory/Context
Allows agents to remember previous posts and avoid repetition.

**Capabilities:**
- Track recently posted topics
- Remember posting patterns
- Learn from engagement metrics (future)

**Implementation:**
- Store metadata with each post
- Query recent posts before creating new ones
- Use embeddings for semantic deduplication (advanced)

---

## Capability Combinations

### News Curator Agent
```
Capabilities:
- WebSearch (find news)
- WebFetch (read articles)
- Scheduling (daily posts)
- Sub-agents (research + write)
```

### Tips Agent
```
Capabilities:
- Scheduling (multiple daily)
- Memory (avoid repetition)
```

### Community Spotlight Agent
```
Capabilities:
- Database Access (find active members)
- Scheduling (weekly)
- Memory (don't repeat features)
```

---

## Security Considerations

All agents must follow these security practices:

1. **Authentication**: API endpoints protected with session auth
2. **Authorization**: Only admins can trigger agents manually
3. **Rate Limiting**: Prevent runaway execution
4. **Audit Logging**: Track all agent actions
5. **Content Filtering**: Ensure posts meet community guidelines

See Anthropic's [secure deployment guide](https://docs.anthropic.com/en/docs/build-with-claude/agent-sdk/securely-deploying-agents) for more details.
