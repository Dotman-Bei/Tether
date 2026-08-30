# Tether

## WebMCP Challenge MVP Build Specification

> **One-line pitch:** Tether is a shared memory layer for the agent-native web. Participating websites expose WebMCP tools that let an agent save, retrieve, update, and delete useful user context across web experiences, while the human controls what persists.

---

## 0. Build North Star

Build a polished, demo-first MVP that makes one idea unforgettable:

**Teach once → Tether remembers → another site uses the context without the user repeating it.**

The product must make WebMCP a core part of the experience, not an add-on.

### The exact demo story

1. A user opens **DesignLab**.
2. The agent learns three preferences from the user:
   - prefers dark interfaces
   - prefers compact layouts
   - prefers TypeScript
3. DesignLab uses a WebMCP tool to store those memories in Tether.
4. Tether immediately shows the memories in its memory feed.
5. The user opens **DevForge**, a second WebMCP-enabled site.
6. The user asks the agent to create a starter project.
7. DevForge's WebMCP tool retrieves relevant memories from Tether.
8. DevForge produces a project configured with the stored preferences.
9. The user opens Tether and removes one memory.
10. The demo shows that human control determines what persists.

The audience should understand the value before seeing implementation details.

---

# 1. Hackathon Alignment

The current official rules require a WebMCP-powered web app that explores the future of the open web where humans and agents interact, collaborate, and create together. The judged criteria are equally weighted:

- WebMCP Leverage
- Execution
- Potential Impact
- Creativity & Ambition

The submission must provide a working live URL, public source repository with an open-source license, written description, and a public YouTube demonstration video of less than three minutes. Judges may rely on the submitted description, screenshots, and video rather than testing the app. Tether must therefore make the WebMCP behavior obvious inside the video itself.

**Important:** WebMCP tools are page-provided capabilities. Do not claim that WebMCP itself magically carries memory from one unrelated site to another. Tether is the shared persistence layer; participating sites expose their own WebMCP tools that read/write that shared layer.

Reference: https://webmcp.devpost.com/rules

---

# 2. Product Definition

## Product name

**Tether**

## Tagline

**Teach once. Carry forward.**

## Product category

Agent memory infrastructure / agent-native web utility.

## Core problem

Agents often lose useful context between separate web experiences. Users repeatedly restate preferences, constraints, and working conventions.

## Tether's solution

Tether stores structured, user-controlled context in a shared memory layer that participating WebMCP-enabled sites can access through agent-callable tools.

## What makes it different

The memory is not positioned as an assistant-specific chat history. It is **structured context available to participating web experiences**.

---

# 3. MVP Scope

Keep the MVP intentionally small. Do not build a browser extension, arbitrary third-party website integration, complex vector database, multi-user organization system, billing, or a large SDK during the hackathon.

## Must ship

### Tether dashboard

- memory feed
- memory search/filter
- memory detail drawer/modal
- source website
- category
- tags
- confidence indicator
- created/updated time
- delete action
- clear explanation of what participating sites can access

### Tether API

Minimum endpoints:

```text
POST   /api/memory
GET    /api/memory/search?q=...
PATCH  /api/memory/:id
DELETE /api/memory/:id
```

Optional if useful:

```text
GET    /api/memory/:id
GET    /api/memory?source=...
```

### WebMCP tools

Tether itself should expose:

```text
store_context
retrieve_context
update_context
delete_context
```

Participating demo sites should expose their own meaningful WebMCP tools too.

### Demo website 1: DesignLab

A small design/productivity app whose purpose is to establish user context.

Example user intent:

> "Remember that I prefer dark interfaces, compact layouts, and TypeScript."

DesignLab should make it obvious that the agent is calling a WebMCP tool to persist that context.

### Demo website 2: DevForge

A small developer/project setup app that consumes the previously stored context.

Example user intent:

> "Create a starter project for me."

DevForge should retrieve relevant context and visibly apply it:

```text
Language: TypeScript
UI theme: Dark
Layout: Compact
```

### Human control

The user must be able to inspect and delete a memory from Tether.

---

# 4. Recommended Stack

Use a boring stack that is fast to ship.

```text
Frontend:      Next.js + TypeScript
UI:            Tailwind CSS + shadcn/ui (or equivalent)
Backend:       Next.js route handlers / server actions
Database:      Supabase Postgres
Hosting:       Vercel
WebMCP:        navigator.modelContext.registerTool(...)
Validation:    Zod
Icons:         Lucide
```

Do not introduce infrastructure unless it solves a demonstrated problem.

---

# 5. Repository Structure

Prefer a monorepo so the three experiences can share types and utilities.

```text
/tether
  /apps
    /tether-dashboard
    /designlab
    /devforge
  /packages
    /shared
    /webmcp
  /supabase
    /migrations
  /public
  README.md
  LICENSE
  package.json
```

A simpler single Next.js app with route-based demo sites is acceptable if it is faster and remains visually convincing:

```text
/
/designlab
/devforge
/memory
/api/...
```

Do not let architecture reduce demo quality.

---

# 6. Data Model

Use structured memories instead of plain key/value storage.

Suggested schema:

```ts
export type Memory = {
  id: string;
  userId: string;
  content: string;
  category: "preference" | "workflow" | "project" | "constraint" | "other";
  tags: string[];
  source: string;
  confidence: number;
  scope: "personal";
  createdAt: string;
  updatedAt: string;
};
```

### Example records

```json
{
  "content": "User prefers dark interfaces",
  "category": "preference",
  "tags": ["ui", "design"],
  "source": "DesignLab",
  "confidence": 0.94,
  "scope": "personal"
}
```

```json
{
  "content": "User prefers TypeScript for new projects",
  "category": "preference",
  "tags": ["development", "language"],
  "source": "DesignLab",
  "confidence": 0.96,
  "scope": "personal"
}
```

For the MVP, semantic retrieval can be implemented with simple text/tag matching if necessary. Do not spend hackathon time over-engineering embeddings unless retrieval quality actually needs them.

---

# 7. WebMCP Implementation

Use the current WebMCP interface as supported by the hackathon environment. The repository should visibly contain genuine tool registration using the WebMCP API.

Representative pattern:

```ts
document.modelContext.registerTool({
  name: "retrieve_context",
  description: "Retrieve relevant user context from Tether",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What context is needed"
      },
      source_filter: {
        type: "string",
        description: "Optional source site filter"
      }
    },
    required: ["query"]
  },
  execute: async ({ query, source_filter }) => {
    // Call Tether API and return structured context.
  }
});
```

Use the exact API shape required by the current WebMCP implementation available in the judging environment. Do not invent unsupported browser APIs.

## Tool design principles

Every tool needs:

- a clear name
- a useful description
- a constrained input schema
- predictable structured output
- a real product purpose

### Tether tools

#### `store_context`

Purpose: persist useful user context.

Suggested input:

```json
{
  "content": "User prefers dark interfaces",
  "category": "preference",
  "tags": ["ui", "design"],
  "source": "DesignLab",
  "confidence": 0.94
}
```

#### `retrieve_context`

Purpose: retrieve context relevant to the current task.

Suggested input:

```json
{
  "query": "preferences for creating a new project"
}
```

#### `update_context`

Purpose: modify an existing memory.

#### `delete_context`

Purpose: honor the user's decision to remove a memory.

### DesignLab tools

At minimum:

```text
save_preference
get_preferences
```

### DevForge tools

At minimum:

```text
get_user_context
create_project
apply_preferences
```

The goal is not to maximize the number of tools. The goal is to show that meaningful website capabilities can be exposed to an agent and combined into a coherent cross-site workflow.

---

# 8. Cross-Site Workflow

Implement a shared backend contract.

```text
DesignLab
   |
   | WebMCP: save_preference
   v
Tether API
   |
   v
Supabase
   ^
   |
   | WebMCP: get_user_context
   |
DevForge
```

### Required flow

```text
User intent
   ↓
Agent
   ↓
DesignLab WebMCP tool
   ↓
Tether API
   ↓
Database
```

Then:

```text
User intent on DevForge
   ↓
Agent
   ↓
DevForge WebMCP tool
   ↓
Tether API
   ↓
Relevant memories
   ↓
Agent applies context
   ↓
Project result
```

---

# 9. UI/UX Direction

The interface should feel like a polished developer tool rather than a generic AI dashboard.

## Visual language

- dark-first interface
- clean typography
- restrained motion
- small status badges
- command/tool activity visualization
- memory cards with source and timestamps
- clear human control surfaces
- no excessive gradients or decorative AI imagery

## Tether home screen

Suggested layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ TETHER                                ● Memory layer online │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Shared context                                             │
│  12 memories                              [ Search memory ] │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Preference                               NEW           │  │
│  │ User prefers dark interfaces                           │  │
│  │ DesignLab  •  UI / Design  •  High confidence         │  │
│  │                                  [View] [Delete]        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Preference                                             │  │
│  │ User prefers TypeScript for new projects                │  │
│  │ DesignLab  •  Development  •  High confidence          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Activity panel

During the demo, show a live activity stream:

```text
13:41:04  WebMCP  store_context
13:41:04  Tether  memory created
13:42:18  WebMCP  retrieve_context
13:42:18  Tether  3 relevant memories returned
13:42:19  DevForge preferences applied
```

This is crucial for making the invisible agent/backend flow visible on video.

---

# 10. Human Control / Trust UX

The product should never feel like a silent memory vacuum.

Each memory should visibly show:

```text
Source: DesignLab
Category: Preference
Confidence: High
Stored: just now

[Keep] [Delete]
```

Add a small explanation somewhere in the UI:

> Tether only exposes memories that the user has allowed participating sites to use.

For MVP, keep the permission model simple and explicit. Do not implement a complicated authorization framework.

---

# 11. Demo Seed Data

Seed the demo account with no memories initially, then create them live during recording.

The three memories should be:

```text
User prefers dark interfaces.
User prefers compact layouts.
User prefers TypeScript for new projects.
```

Do not pre-populate these if the video is supposed to demonstrate the agent learning them. The audience needs to see the memory enter the system.

---

# 12. Error and Empty States

Implement at minimum:

### No memories

```text
No memories yet.
Teach Tether something useful from a participating site.
```

### Retrieval failure

```text
Tether couldn't retrieve context.
The site can continue without saved preferences.
```

### Delete confirmation

Make deletion obvious and reversible only if it is easy. Otherwise use a clear confirmation.

### Unsupported environment

Show:

```text
WebMCP tools are unavailable in this browser.
Use the supported hackathon environment to run the agent demo.
```

Do not fake tool calls when WebMCP is unavailable.

---

# 13. Development Order

Build in this exact order to reduce risk.

## Phase 1: Skeleton

- create repo
- create apps/routes
- establish shared types
- set up database
- add environment variables
- create a minimal dashboard

## Phase 2: Memory API

- create memory table
- implement create/read/search/update/delete
- seed test data manually
- test API independently

## Phase 3: Tether WebMCP

- register tools
- validate schemas
- connect tools to API
- verify actual agent discovery/calling in supported WebMCP environment

## Phase 4: DesignLab

- polished mini-app
- add WebMCP tools
- implement save-preference flow
- verify memories appear in Tether immediately

## Phase 5: DevForge

- polished mini-app
- add WebMCP tools
- implement context retrieval
- visibly apply returned preferences to generated project configuration

## Phase 6: Human control

- memory detail
- delete
- activity feed
- retrieval transparency

## Phase 7: Demo polish

- remove dead UI
- improve loading/error states
- make tool activity visible
- ensure transitions are fast
- eliminate unnecessary clicks

## Phase 8: Hardening

- fresh deployment test
- fresh browser/session test
- README setup test
- verify repository license
- verify no secrets in repo
- verify all demo links

---

# 14. Acceptance Tests

The MVP is not complete until all of the following pass.

### WebMCP

- [ ] WebMCP tools are actually registered in the code.
- [ ] Agent can discover the relevant tools in the supported browser.
- [ ] Agent can call `store_context` successfully.
- [ ] Agent can call `retrieve_context` successfully.
- [ ] Agent can update/delete context successfully.

### Tether

- [ ] A stored memory appears in the dashboard without manual refresh if practical.
- [ ] Each memory has source/category/tags/confidence/time.
- [ ] Search finds relevant memories.
- [ ] Delete works.
- [ ] Activity feed records tool actions.

### Cross-site demo

- [ ] DesignLab can create memory in Tether.
- [ ] DevForge can retrieve that memory.
- [ ] DevForge visibly applies the returned preferences.
- [ ] The user does not manually re-enter those preferences on DevForge.

### Reliability

- [ ] No critical console errors during the demo.
- [ ] No exposed API keys/secrets.
- [ ] Deployment works from a clean session.
- [ ] App loads quickly enough that demo pacing does not stall.

---

# 15. Three-Minute Demo Script

The video must stay under three minutes. Target roughly **2:20–2:40** to leave safety margin.

## 0:00–0:20 — Problem

Show a split-screen or quick sequence:

> "Every website makes agents start from scratch. Tether gives participating sites a shared memory layer."

Keep this under 20 seconds.

## 0:20–0:55 — Teach Tether

Open DesignLab.

User says:

> "Remember that I prefer dark interfaces, compact layouts, and TypeScript."

Show the agent invoking WebMCP.

Show Tether receiving three memories.

Overlay:

```text
WebMCP → store_context → Tether
```

## 0:55–1:25 — Move to another site

Open DevForge.

User says:

> "Create a starter project for me."

Show:

```text
WebMCP → retrieve_context → Tether
```

Then the project appears configured as:

```text
TypeScript
Dark UI
Compact layout
```

Overlay:

> No preferences entered here.

This is the main "aha" moment.

## 1:25–1:45 — Human control

Open Tether.

Show memory timeline.

Delete one memory.

Say:

> "The agent can remember, but the user decides what stays."

## 1:45–2:10 — Technical explanation

Show the architecture briefly:

```text
DesignLab ──WebMCP──┐
                    ├── Tether API ── Database
DevForge ──WebMCP──┘
```

Show a short code snippet containing `document.modelContext.registerTool(...)`.

Do not read code aloud.

## 2:10–2:35 — Impact / ambition

Say:

> "Tether turns memory into a shared layer for the agent-native web. Instead of memory being trapped inside one assistant or app, participating websites can expose context-aware tools while people keep control of what persists."

End on the product UI and a simple title card:

**Tether — Teach once. Carry forward.**

---

# 16. Demo Recording Rules

Assume the judge will watch only the first three minutes.

### Do

- show the real WebMCP interaction
- show tool names on screen
- show the memory entering Tether
- switch to a second site
- show retrieval and application of memory
- show human deletion
- show a tiny amount of real code
- use clear narration
- use large readable UI
- keep the cursor movement intentional

### Do not

- spend 45+ seconds on setup
- start with architecture diagrams
- explain the database before showing the product
- use fake terminal output as the main proof
- rely on the judge understanding hidden backend behavior
- claim WebMCP itself provides cross-site memory
- include copyrighted music or third-party copyrighted material without permission

---

# 17. README Requirements

The repository README should make the project understandable in under two minutes.

Use this structure:

```text
# Tether
Teach once. Carry forward.

## What it is

## Why WebMCP

## The problem

## How the cross-site demo works

## Architecture

## WebMCP tools

## Local setup

## Environment variables

## Demo flow

## Screenshots

## Tech stack

## License
```

Include screenshots/GIFs of:

1. Tether memory feed
2. DesignLab storing context
3. DevForge retrieving context
4. WebMCP tool registration/code

---

# 18. Suggested Project Description Structure for Devpost

Do not copy this as marketing fluff. Adapt it after the app is complete.

## Problem

Agents repeatedly lose useful context when users move between separate web experiences.

## Solution

Tether provides a shared, structured memory layer that participating websites can access through WebMCP tools.

## Why WebMCP

WebMCP lets websites expose meaningful capabilities directly to agents. Tether uses those capabilities to make memory retrieval and persistence part of normal web workflows rather than a separate copy/paste step.

## Human + agent collaboration

Agents can capture and retrieve useful context, while humans inspect and remove memories they do not want persisted.

## What was difficult before

A user could ask an agent to remember something, but carrying that useful context into a different participating website typically required repeated instructions or bespoke integrations. Tether demonstrates a shared memory layer for an agent-native web.

## Implementation

Explain:

- WebMCP tool registration on each demo site
- shared Tether API
- database schema
- retrieval logic
- human-controlled memory UI

---

# 19. Scoring Strategy

## 1. WebMCP Leverage

Target: **excellent**

Prove genuine, non-trivial usage by having WebMCP power the workflow across multiple surfaces.

Evidence to expose:

- real `registerTool` code
- multiple useful tools
- real agent calls
- structured inputs/outputs
- visible tool activity

## 2. Execution

Target: **excellent**

Make the project feel finished.

Prioritize:

- consistent visual system
- no dead buttons
- fast interactions
- clean empty/error states
- complete cross-site workflow

## 3. Potential Impact

Target: **strong**

Tell a specific story:

- designers repeatedly re-enter preferences
- developers repeatedly explain conventions
- research/product workflows lose useful context between sites

Do not make vague claims about "revolutionizing AI." Show the friction and remove it.

## 4. Creativity & Ambition

Target: **excellent**

Pitch the larger vision:

> Tether is not another assistant. It is a shared memory layer for a web where agents can act across participating experiences.

The two fake sites are an MVP demonstration of the broader protocol/product direction.

---

# 20. Edge Features: Only Add After Core Demo Works

Do not add these until the core demo is rock solid.

Possible polish features:

### Memory confidence

Show why a memory is high/medium/low confidence.

### Source lineage

Click a memory to see:

```text
Created by: DesignLab
At: 13:41
Tool: store_context
```

### Context preview

Before DevForge applies context:

```text
Tether found 3 memories

[Use these preferences] [Ignore]
```

This is especially good for the human-in-the-loop story.

### Retrieval explanation

Show:

```text
Query: "preferences for a new project"
Matched: 3 memories
```

Only add this if it makes the demo clearer rather than slower.

---

# 21. What NOT to Build

Explicitly avoid:

- Chrome extension
- full browser integration
- support for arbitrary third-party websites
- OAuth integrations with dozens of services
- complex role/permission management
- billing/subscriptions
- autonomous memory writing with no user transparency
- custom vector infrastructure unless needed
- mobile app
- native desktop app
- elaborate analytics dashboard
- complicated agent orchestration framework

The MVP wins through **one undeniable cross-site memory workflow**.

---

# 22. Security / Privacy Baseline

Even for a hackathon demo:

- never hardcode secrets
- keep server-only credentials server-side
- validate tool inputs
- sanitize rendered memory content
- avoid storing sensitive personal data in demo records
- do not expose database credentials to the browser
- scope demo memories to a single demo user/session
- include an explicit delete path

Do not claim production-grade privacy/security. Present this as an MVP architecture.

---

# 23. Final Pre-Submission QA

Run this exact sequence in a fresh environment:

```text
1. Open deployed Tether.
2. Open supported WebMCP environment.
3. Open DesignLab.
4. Teach the agent the three preferences.
5. Confirm WebMCP tool calls occur.
6. Confirm memories appear in Tether.
7. Open DevForge.
8. Ask for a starter project.
9. Confirm retrieve_context is called.
10. Confirm all three preferences are applied.
11. Return to Tether.
12. Delete one memory.
13. Refresh.
14. Confirm deletion persists.
15. Repeat the critical demo from a clean session.
```

If any step feels confusing without narration, improve the UI rather than adding more narration.

---

# 24. AFTER-BUILD HACKATHON SUBMISSION CHECKLIST

This section is intentionally aggressive. Use it as the final edge pass.

## A. Rules / eligibility

- [ ] Confirm the entrant/team satisfies the current eligibility rules.
- [ ] Confirm the project is new or, if pre-existing, clearly document the new WebMCP work added during the submission period.
- [ ] Ensure no prohibited/conflicting relationship or outside support creates an eligibility issue.
- [ ] Ensure third-party SDKs/APIs/data are used under their applicable terms.

## B. WebMCP proof

- [ ] Search the repository for `document.modelContext.registerTool`.
- [ ] Confirm the deployed environment exposes the intended tools.
- [ ] Confirm at least one tool is genuinely used in the recorded demo.
- [ ] Prefer multiple meaningful tools across the cross-site workflow.
- [ ] Ensure tool names/descriptions clearly communicate what they do.
- [ ] Make sure WebMCP is visible in the video, not merely mentioned in the README.

## C. Product quality

- [ ] Every visible button works or has been removed.
- [ ] Loading states are polished.
- [ ] Errors are understandable.
- [ ] Empty states look intentional.
- [ ] Mobile responsiveness is not embarrassing, even if desktop is the primary judging path.
- [ ] No placeholder text such as "Lorem ipsum" remains.
- [ ] No console errors during the demo.
- [ ] No accidental debug overlays remain in production.

## D. The "aha" moment

Watch the demo **without sound** once.

A viewer should still understand:

```text
Site A
  ↓
Tether stores memory
  ↓
Site B
  ↓
Tether retrieves memory
  ↓
Agent uses it
```

If they cannot, add visible on-screen labels.

## E. Three-minute submission video

- [ ] Video is less than 3 minutes.
- [ ] Audio clearly explains what was built and how WebMCP is used.
- [ ] The first 20 seconds establish the problem.
- [ ] The first 60–90 seconds contain the strongest product moment.
- [ ] The cross-site transfer is shown live.
- [ ] The human control moment is shown.
- [ ] Technical implementation is demonstrated briefly.
- [ ] No copyrighted music/material without permission.
- [ ] Video is public on YouTube.
- [ ] Video link has been tested in an incognito/private browser.

### Recording edge

Do one take that prioritizes **clarity over cinematics** and one that prioritizes **speed/polish**. Choose whichever makes the core WebMCP mechanism easier to understand.

## F. Devpost description

Before submitting, check every paragraph against the four judging questions:

```text
WebMCP Leverage → Is genuine WebMCP use obvious?
Execution        → Does it feel complete?
Impact           → Is the problem concrete and real?
Creativity       → Is the concept meaningfully different?
```

Do not spend most of the word count describing the database.

## G. Repository

- [ ] Repository is public.
- [ ] Repository contains complete source code and assets.
- [ ] Repository has setup instructions.
- [ ] Repository has the required open-source license.
- [ ] License is visible/detectable on the repository page/About area.
- [ ] `.env` / secrets are not committed.
- [ ] Demo credentials, if needed, are documented safely.
- [ ] A fresh clone can run the project.
- [ ] The repository's main branch matches the submitted demo.

## H. Submission reproducibility

Because judges are not required to test the project, the **submitted artifacts must agree with each other**.

Verify:

- [ ] Video matches current UI.
- [ ] README matches current architecture.
- [ ] Devpost description matches current behavior.
- [ ] Live URL matches the version shown in the video.
- [ ] Screenshots are from the submitted build.

## I. Final judge-perspective test

Give the submission to a friend who knows nothing about Tether.

Ask them only:

> "What did this project build, and what does WebMCP have to do with it?"

A strong answer should sound approximately like:

> "It lets an agent store useful user context in Tether on one site and retrieve it on another through WebMCP, while the user controls the memory."

If they cannot explain that after watching the demo, the submission is not ready.

## J. Freeze the submission

Before the official submission deadline:

- [ ] Capture the final video.
- [ ] Push final code.
- [ ] Verify deployed build.
- [ ] Verify README.
- [ ] Verify license.
- [ ] Fill every Devpost field.
- [ ] Submit.
- [ ] Save a local copy of the exact submission materials.

After the submission period ends, follow the official rules regarding modifications. Do not casually change the submitted project/version during judging.

---

# 25. Final Build Principle

Whenever scope decisions become difficult, ask:

> **Does this make the judge understand "WebMCP lets the agent carry useful context through Tether between web experiences" more clearly?**

If yes, build it.

If no, cut it.

The winning MVP is not the one with the most features. It is the one where a judge can watch a user teach an agent something on one site, move to another site, and immediately see that knowledge become useful.

---

## Official challenge reference

Current official rules and requirements:

https://webmcp.devpost.com/rules

Deadline listed on the current rules page: **September 3, 2026 at 1:00 PM PDT**.
