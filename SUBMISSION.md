# Devpost submission draft — Tether

Working draft for the Devpost fields. Not part of the app; delete before final push if you'd
rather not ship it in the repo. Every claim here is checked against what the code actually does —
keep it that way as the project changes.

---

## Tagline

Teach once. Carry forward. A shared memory layer for the agent-native web.

---

## Inspiration

You tell one site you prefer dark interfaces, compact layouts, and TypeScript. Then you open the
next tool and type all of it again. And again. Agents are supposed to remove that friction, but
today each one starts cold at every tab boundary, so the person ends up being the integration
layer — the only thing carrying context from one site to the next.

WebMCP changes what a website can offer an agent: real, page-provided capabilities instead of a
DOM to scrape. That made a specific question worth answering. If every site can expose genuine
tools, what is the one shared capability that would make all of them more useful at once?

Memory. Not an assistant's private chat history, but structured context that any participating
site can read and write, with the person holding the delete key.

## What it does

Tether is a shared persistence layer for user context, plus two participating sites that prove it
works across a boundary:

- **DesignLab** (producer) — a small design studio. Ask the agent to remember your preferences and
  its `save_preference` tool applies them to the canvas *and* writes them to Tether.
- **DevForge** (consumer) — a project scaffolder that has never met you. Its form has no theme
  picker, no language selector, no density setting. It calls `create_project`, which asks Tether
  what you prefer, and generates a project configured as TypeScript / Dark / Compact.
- **Tether Control Plane** — every memory with its source, the tool that wrote it, tags,
  confidence, and time. Inspect, edit, or permanently delete any of it.

The moment that matters: delete the TypeScript memory in Tether, scaffold again in DevForge, and
the language falls back to the JavaScript default. The memory is genuinely driving the output —
not a hardcoded demo path.

## How WebMCP is used

Nine tools across three surfaces, each with a constrained input schema, predictable structured
output, and a real product purpose.

| Surface | Tools |
| --- | --- |
| Tether | `store_context`, `retrieve_context`, `update_context`, `delete_context` |
| DesignLab | `save_preference`, `get_preferences` |
| DevForge | `get_user_context`, `create_project`, `apply_preferences` |

These are not thin wrappers over the API. `save_preference` changes what DesignLab renders.
`create_project` produces a real scaffold. The memory write is a side effect of doing the actual
job the user asked for, which is the point — memory becomes part of a normal workflow rather than
a separate copy-paste step.

Tools are registered against the page's own model context. Because different WebMCP builds expose
it differently, the adapter probes `navigator.modelContext`, `window.modelContext`, and
`document.modelContext`, and supports both imperative `registerTool()` and declarative
`provideContext()`.

**One thing we're careful not to overclaim:** WebMCP does not carry memory between unrelated sites
on its own. It is the tool interface on each page. Tether is the shared backplane those tools read
from and write to. The cross-site continuity comes from the shared layer, and saying otherwise
would misrepresent the protocol.

## Human + agent collaboration

The agent captures and retrieves; the person governs. Every memory shows where it came from and
which tool created it. Retrieval is explained rather than asserted — DevForge displays the query it
ran, the memories that matched, and *why* each one matched, with a "Use these / Ignore" control
before anything is applied. Deletion is immediate and global, with no archive table and no
soft-delete flag.

When no model context is present, the UI says so plainly. On-page controls run the identical tool
handlers, and every resulting log line is stamped `MANUAL` rather than `AGENT`. We never draw a
fake agent turn.

## How we built it

Next.js 15 (App Router) and TypeScript, Tailwind for a dark, high-density developer-tool aesthetic,
Zod validating every tool input before it reaches the store, and Supabase Postgres for persistence.
The store is pluggable — with no environment variables it uses an in-process driver, so a fresh
clone runs immediately.

Retrieval is deliberately lexical, not embeddings: tag hits weigh most, then content-word overlap,
then a category-intent nudge, with confidence only breaking ties. Over a handful of short,
structured statements this is both accurate and — more importantly — explainable, which is what
lets the UI show the user why a memory was applied.

The activity log is server-side rather than client-side, so a tool call in the DesignLab tab
appears live in the Tether tab. That cross-tab visibility is what makes an invisible
agent → tool → API → database round-trip legible on camera.

## Challenges we ran into

**Proving the memory is real.** A cross-site demo can be faked by a hardcoded path, and a judge is
right to suspect that. The answer was to make deletion part of the demo: remove a memory, scaffold
again, and watch that one setting fall back to its default while the others hold.

**Being honest about environment support.** It would have been easy to simulate tool calls when no
agent is present and let the video imply otherwise. Instead the app detects the absence, reports
it, and labels every manual invocation — which turned out to make the architecture *clearer*,
because you can see that the agent path and the button path run the same handler.

**Retrieval that explains itself.** Returning the right memories is not enough if the user cannot
tell why. Carrying `matchedOn` reasons through the API into the UI meant the whole retrieval
pipeline had to stay interpretable, which ruled out an opaque similarity score.

## What we learned

Structure is what makes shared memory usable. A pile of chat transcripts cannot be filtered,
scored, explained, or selectively deleted. Category, tags, source, and confidence are what let a
second site retrieve something specific, apply it, and show its work — and what let a person
meaningfully govern it.

We also learned that trust surfaces are product features, not compliance overhead. The lineage
view and the labelled telemetry stream are the parts that make people believe the rest.

## What's next for Tether

- A small client library so a site can join in a few lines instead of reimplementing the contract.
- Real accounts and scoped consent — per-site read permissions rather than one shared session.
- Memory decay and conflict resolution: preferences change, and the layer should notice when a new
  statement contradicts an old one instead of accumulating both.
- Richer context types beyond preferences — working conventions, project constraints, domain vocab.

The two demo sites are an MVP illustration. The direction is a shared memory layer that any
participating experience can build on, with the person holding the keys.

---

## Field checklist before submitting

- [x] Live URL deployed: https://tether-swart.vercel.app (Supabase driver verified 33/33 in production)
- [x] Public repo: https://github.com/Dotman-Bei/Tether
- [x] MIT license detectable on the repo page
- [ ] YouTube video under 3 minutes, public, tested in a private window
- [x] Screenshots captured (see `public/screenshots/`) — re-shoot if the UI changes
- [ ] Description proofread against current behavior — no claim the code cannot back
