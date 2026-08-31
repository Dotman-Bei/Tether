# Tether — 3-minute demo recording script

Target **2:25–2:40**. The hard limit is 3:00; leaving margin means a fumbled take still fits.

Record in the **ChatGPT desktop in-app browser** so WebMCP is live. The green badge and the
`AGENT`-stamped telemetry lines are the difference between claiming WebMCP leverage and showing it.

---

## Pre-flight

- [ ] ChatGPT desktop open, Tether loaded in the in-app browser
- [ ] Badge reads **● WEBMCP ACTIVE** (amber means you are in the wrong browser)
- [ ] **Reset sandbox** clicked — you must start from the empty state
- [ ] Display scaled up so text is readable at 1080p; close unrelated tabs
- [ ] Tabs pre-opened in order: `/designlab`, `/dashboard`, `/devforge`
- [ ] Notifications silenced
- [ ] Mic tested — narration carries this more than the visuals do

Have this open on a second screen. Do not read it aloud verbatim; the wording below is a floor,
not a script to perform.

---

## 0:00–0:18 — The problem

**On screen:** the Tether landing page, scrolling slowly through the four problem cards.

> "Every website makes an agent start from scratch. You tell one tool you like dark mode,
> TypeScript, compact layouts — then you open the next tool and type it all again. You end up
> being the integration layer."

Keep moving. Do not linger here; the product is the argument.

---

## 0:18–0:55 — Teach one site

**On screen:** `/designlab`. Pause a beat on the green **WEBMCP ACTIVE** badge — click it so the
tool list is visible for a second.

> "DesignLab is a small design studio. It exposes its own WebMCP tools, so an agent can actually
> use it."

**Type to the agent:**

```
Remember that I prefer dark interfaces, compact layouts, and TypeScript.
```

**On screen:** the canvas flips dark and compact. Telemetry prints `save_preference` three times.

> "The agent called DesignLab's own tool. That changed the studio — and wrote three structured
> memories into Tether."

Point the cursor at the `AGENT` stamps in the telemetry log.

---

## 0:55–1:15 — The memory layer

**On screen:** `/dashboard`.

> "Here they are. Each one shows which site wrote it, which tool created it, tags, a confidence
> score, and when."

Click **View lineage** on one card. Let the drawer sit for two seconds. Close it.

---

## 1:15–1:50 — A site that has never met you ⭐

**On screen:** `/devforge`. **Slow down here.** Scroll the form deliberately before doing anything.

> "DevForge is a different site. Look at the form — no theme picker, no language selector, no
> density setting. It has never met me."

**Type to the agent:**

```
Create a starter project for me.
```

**On screen:** the retrieval banner, then the configuration table filling in.

> "It asked Tether what I prefer — and configured the whole project from the answer. TypeScript,
> dark, compact, Vite, pnpm, Tailwind. I entered none of that here."

**Overlay text:** `NO PREFERENCES ENTERED ON THIS SITE`

Hover the provenance arrows so the `← "User prefers TypeScript for new projects"` lines are legible.

---

## 1:50–2:10 — The human decides ⭐⭐

**On screen:** `/dashboard`. Delete the TypeScript memory, confirm.

> "The agent can remember. I decide what stays."

Back to `/devforge`, run it again.

> "Same request. But that preference is gone — so the language falls back to the default. The
> memory was doing the work, not a hardcoded demo."

**This is the shot that answers the sceptic.** If you cut anything, do not cut this.

---

## 2:10–2:30 — How it works

**On screen:** `/protocol` — the tool catalog, then the `registerTool` code block.

> "Ten WebMCP tools across three surfaces. Each site registers its own on the page's model context.
> Tether is the shared layer they read and write."

> "To be precise: WebMCP doesn't carry memory between sites on its own. It's the tool interface on
> each page. The continuity comes from the shared layer underneath."

Do not read the code aloud. Two seconds on screen is enough.

---

## 2:30–2:40 — Close

**On screen:** the landing hero.

> "Tether — teach once, carry forward. A shared memory layer for the agent-native web, where people
> keep control of what persists."

End on the title card.

---

## Watch it back once with the sound off

A viewer with no audio should still follow:

```
Site A  →  memory stored  →  Site B  →  memory retrieved  →  applied  →  human deletes it
```

If they cannot, add on-screen labels rather than more narration.

## Before uploading

- [ ] Under 3:00
- [ ] The cross-site transfer happens live, not in a cut
- [ ] The delete-and-fallback moment is intact
- [ ] Tool names legible on screen at least once
- [ ] No copyrighted music
- [ ] Uploaded to YouTube as **public** (not unlisted)
- [ ] Link opened in a private window to confirm it plays
