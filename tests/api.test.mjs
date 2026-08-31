/**
 * Tether API and memory-store test suite.
 *
 * Exercises every route handler and, through them, whichever store driver is
 * configured — the in-process default or Supabase Postgres. The same file is
 * therefore both a local regression suite and a production smoke test:
 *
 *   npm test                                   # against http://localhost:3000
 *   BASE_URL=https://your-app.vercel.app npm test
 *
 * No test framework and no dependencies: Node 18+ has fetch and this needs
 * nothing else. Requires the app to be running (`npm run dev`, or
 * `npm run build && npm start`).
 *
 * Every memory it creates is scoped to its own session cookie and removed at
 * the end, so it is safe to point at a live deployment.
 */

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TIMEOUT = Number(process.env.TIMEOUT_MS ?? 20000);

let passed = 0;
let failed = 0;
const failures = [];

function check(label, actual, expected) {
  const ok = Object.is(actual, expected);
  if (ok) {
    passed += 1;
    console.log(`  \x1b[32mPASS\x1b[0m  ${label}`);
  } else {
    failed += 1;
    failures.push(`${label}\n        expected: ${expected}\n        actual:   ${actual}`);
    console.log(`  \x1b[31mFAIL\x1b[0m  ${label}  (expected ${expected}, got ${actual})`);
  }
}

function group(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

/* ------------------------------------------------------------------ */
/* A minimal cookie jar — the session cookie is what scopes memories.  */
/* ------------------------------------------------------------------ */

function createSession() {
  let cookie = "";

  return async function request(path, options = {}) {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
        ...options.headers,
      },
      signal: AbortSignal.timeout(TIMEOUT),
      redirect: "manual",
    });

    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const entry of setCookie) {
      const [pair] = entry.split(";");
      if (pair?.startsWith("tether_uid=")) cookie = pair;
    }

    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: response.status, body };
  };
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log(`\nTether API suite → ${BASE}\n${"─".repeat(52)}`);

  const api = createSession();

  // Preflight: fail loudly rather than reporting 30 confusing failures.
  try {
    const health = await api("/api/health");
    if (health.status !== 200) throw new Error(`health returned ${health.status}`);
    console.log(`  store driver: \x1b[36m${health.body?.driver}\x1b[0m`);
  } catch (error) {
    console.error(
      `\n  Cannot reach ${BASE}.\n` +
        `  Start the app first (npm run dev, or npm run build && npm start),\n` +
        `  or set BASE_URL to a running deployment.\n\n  ${error.message}\n`,
    );
    process.exit(1);
  }

  // Establish the session cookie, then start from a clean sandbox.
  await api("/");
  await api("/api/activity", { method: "DELETE" });

  /* --- create ----------------------------------------------------- */
  group("create");

  const created = await api("/api/memory", {
    method: "POST",
    body: JSON.stringify({
      content: "User prefers dark interfaces",
      tags: ["ui", "design", "theme"],
      source: "DesignLab",
      confidence: 0.94,
    }),
  });

  check("returns 201", created.status, 201);
  check("returns the memory", typeof created.body?.memory?.id, "string");
  check("category defaults to preference", created.body?.memory?.category, "preference");
  check("confidence is a number, not a string", typeof created.body?.memory?.confidence, "number");
  check("confidence value preserved", created.body?.memory?.confidence, 0.94);
  check("tags round-trip as an array", created.body?.memory?.tags?.length, 3);
  check("scope defaults to personal", created.body?.memory?.scope, "personal");
  check("not flagged duplicate", created.body?.duplicate, false);

  const id = created.body.memory.id;

  for (const [content, tags, confidence] of [
    ["User prefers compact layouts", ["layout", "density"], 0.92],
    ["User prefers TypeScript for new projects", ["development", "language"], 0.96],
  ]) {
    await api("/api/memory", {
      method: "POST",
      body: JSON.stringify({ content, tags, source: "DesignLab", confidence }),
    });
  }

  /* --- duplicate guard -------------------------------------------- */
  group("duplicate guard");

  const dup = await api("/api/memory", {
    method: "POST",
    body: JSON.stringify({ content: "User prefers dark interfaces", source: "DesignLab" }),
  });
  check("duplicate flagged", dup.body?.duplicate, true);
  check("duplicate returns 200, not 201", dup.status, 200);
  check("duplicate reuses the same id", dup.body?.memory?.id, id);

  /* --- list ------------------------------------------------------- */
  group("list and filters");

  const list = await api("/api/memory");
  check("lists all three", list.body?.count, 3);
  check(
    "ordered newest first",
    list.body.memories[0].createdAt >= list.body.memories[2].createdAt,
    true,
  );

  const bySource = await api("/api/memory?source=designlab");
  check("source filter is case-insensitive", bySource.body?.count, 3);

  const byCategory = await api("/api/memory?category=preference");
  check("category filter matches", byCategory.body?.count, 3);

  const empty = await api("/api/memory?category=workflow");
  check("category filter excludes", empty.body?.count, 0);

  /* --- search ----------------------------------------------------- */
  group("ranked retrieval");

  const search = await api(
    "/api/memory/search?q=" + encodeURIComponent("preferences for creating a new project"),
  );
  check("finds all three", search.body?.count, 3);
  check(
    "ranks TypeScript first for a project query",
    search.body.memories[0].content.includes("TypeScript"),
    true,
  );
  check("explains why it matched", search.body.memories[0].matchedOn.length > 0, true);
  check("relevance is numeric", typeof search.body.memories[0].relevance, "number");

  const themed = await api("/api/memory/search?q=" + encodeURIComponent("what theme do I like"));
  check(
    "ranks dark interfaces first for a theme query",
    themed.body.memories[0].content.includes("dark"),
    true,
  );

  const noMatch = await api("/api/memory/search?q=" + encodeURIComponent("zzzz nonexistent"));
  check("returns nothing for an unrelated query", noMatch.body?.count, 0);

  /* --- read and update -------------------------------------------- */
  group("read and update");

  const one = await api(`/api/memory/${id}`);
  check("get by id", one.body?.memory?.content, "User prefers dark interfaces");

  const patched = await api(`/api/memory/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "User strongly prefers dark interfaces", confidence: 0.99 }),
  });
  check("updates content", patched.body?.memory?.content, "User strongly prefers dark interfaces");
  check("updates confidence", patched.body?.memory?.confidence, 0.99);
  check(
    "advances updatedAt",
    patched.body.memory.updatedAt > patched.body.memory.createdAt,
    true,
  );

  const reread = await api(`/api/memory/${id}`);
  check("update persisted", reread.body?.memory?.confidence, 0.99);

  /* --- validation -------------------------------------------------- */
  group("validation and error handling");

  const short = await api("/api/memory", {
    method: "POST",
    body: JSON.stringify({ content: "x" }),
  });
  check("rejects content that is too short", short.status, 422);
  check("names the offending field", short.body?.issues?.[0]?.path, "content");

  const badCategory = await api("/api/memory", {
    method: "POST",
    body: JSON.stringify({ content: "a valid sentence", category: "nonsense" }),
  });
  check("rejects an unknown category", badCategory.status, 422);

  const badJson = await api("/api/memory", { method: "POST", body: "not json" });
  check("rejects malformed JSON", badJson.status, 400);

  const missing = await api("/api/memory/00000000-0000-0000-0000-000000000000");
  check("404s an unknown id", missing.status, 404);

  const missingDelete = await api("/api/memory/00000000-0000-0000-0000-000000000000", {
    method: "DELETE",
  });
  check("404s deleting an unknown id", missingDelete.status, 404);

  /* --- activity ---------------------------------------------------- */
  group("activity log");

  const activity = await api("/api/activity");
  check("records events", activity.body?.events?.length > 0, true);
  check(
    "every event carries an origin",
    activity.body.events.every((event) => ["agent", "manual", "system"].includes(event.origin)),
    true,
  );

  /* --- session isolation ------------------------------------------- */
  group("session isolation");

  const other = createSession();
  await other("/");
  const otherList = await other("/api/memory");
  check("a second visitor sees nothing", otherList.body?.count, 0);

  /* --- delete ------------------------------------------------------ */
  group("delete");

  const deleted = await api(`/api/memory/${id}`, { method: "DELETE" });
  check("returns the deleted row", deleted.body?.deleted?.id, id);

  const afterDelete = await api("/api/memory");
  check("removed from the list", afterDelete.body?.count, 2);

  const goneFromSearch = await api("/api/memory/search?q=" + encodeURIComponent("dark interfaces"));
  check("no longer retrievable", goneFromSearch.body?.count, 0);

  const goneById = await api(`/api/memory/${id}`);
  check("404s by id afterwards", goneById.status, 404);

  /* --- reset (also cleans up after ourselves) ---------------------- */
  group("reset");

  await api("/api/activity", { method: "DELETE" });
  const clearedMemories = await api("/api/memory");
  const clearedActivity = await api("/api/activity");
  check("clears memories", clearedMemories.body?.count, 0);
  check("clears activity", clearedActivity.body?.events?.length, 0);

  /* --- summary ------------------------------------------------------ */
  console.log(`\n${"─".repeat(52)}`);
  if (failed > 0) {
    console.log(`\n\x1b[31m${failed} failed\x1b[0m, ${passed} passed\n`);
    for (const failure of failures) console.log(`  • ${failure}\n`);
    process.exit(1);
  }
  console.log(`\n\x1b[32mAll ${passed} checks passed.\x1b[0m\n`);
}

main().catch((error) => {
  console.error("\nSuite crashed:", error);
  process.exit(1);
});
