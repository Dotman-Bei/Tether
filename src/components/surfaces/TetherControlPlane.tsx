"use client";

import { Database, Search, ShieldCheck, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button, Panel } from "@/components/ui/primitives";
import { useMemories } from "@/hooks/useMemories";
import { useWebMCP } from "@/hooks/useWebMCP";
import { cn } from "@/lib/cn";
import {
  createMemory,
  deleteMemory,
  listMemories,
  logActivity,
  searchMemories,
  updateMemory,
} from "@/lib/client";
import { CATEGORIES, type Category, type Memory } from "@/lib/types";
import { toolError, toolResult, type ToolDefinition } from "@/lib/webmcp";

import { AddMemoryPanel } from "./AddMemoryPanel";
import { EnvironmentNotice } from "./EnvironmentNotice";
import { MemoryCard } from "./MemoryCard";
import { MemoryDrawer } from "./MemoryDrawer";
import { WebMCPBadge } from "./WebMCPBadge";

const SURFACE = "Tether";
const GATE_MESSAGE =
  "Storing context is a WebMCP capability. Open Tether in the ChatGPT desktop app's browser, or Chrome 149+ with chrome://flags/#enable-webmcp-testing enabled.";

function Metric({ label, value, tone }: { label: string; value: string; tone?: "orange" | "green" }) {
  return (
    <div className="flex-1 border-r border-[#1F1F1F] px-4 py-3 last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-semibold",
          tone === "orange" ? "text-accent-orange" : tone === "green" ? "text-signal-green" : "text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function TetherControlPlane({ embedded = false }: { embedded?: boolean }) {
  const { memories, loading, error, refresh } = useMemories();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [source, setSource] = useState<string>("all");
  const [inspecting, setInspecting] = useState<Memory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Memory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  /* --- Highlight memories created in the last few seconds ------------- */
  useEffect(() => {
    const fresh = memories
      .filter((memory) => Date.now() - new Date(memory.createdAt).getTime() < 12_000)
      .map((memory) => memory.id);
    setRecentIds(fresh);
    if (fresh.length === 0) return;
    const timer = setTimeout(() => setRecentIds([]), 12_000);
    return () => clearTimeout(timer);
  }, [memories]);

  /* --- Tether's own WebMCP tools -------------------------------------- */

  const tools = useMemo<ToolDefinition[]>(
    () => [
      {
        name: "store_context",
        description:
          "Persist a useful piece of user context into the Tether shared memory layer so other participating websites can retrieve it later.",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The fact to remember, written as a complete statement.",
            },
            category: {
              type: "string",
              enum: [...CATEGORIES],
              description: "Kind of context being stored.",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Short lookup tags, e.g. ['ui','design'].",
            },
            source: { type: "string", description: "Website that learned this context." },
            confidence: {
              type: "number",
              description: "0-1 certainty that this is a durable user preference.",
            },
          },
          required: ["content"],
        },
        execute: async (args) => {
          await logActivity({
            channel: "WEBMCP",
            label: "store_context",
            detail: String(args.content ?? ""),
            origin: "agent",
          });
          try {
            const { memory, duplicate } = await createMemory({
              content: String(args.content ?? ""),
              category: typeof args.category === "string" ? args.category : "preference",
              tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
              source: typeof args.source === "string" && args.source ? args.source : SURFACE,
              confidence: typeof args.confidence === "number" ? args.confidence : 0.92,
            });
            await refresh();
            return toolResult(
              duplicate
                ? `Tether already remembers "${memory.content}". No duplicate was created.`
                : `Stored in Tether: "${memory.content}" (${memory.category}, confidence ${memory.confidence.toFixed(2)}).`,
              { memory, duplicate },
            );
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : "Store failed.";
            await logActivity({
              channel: "TETHER",
              label: "store_context failed",
              detail: message,
              origin: "agent",
              status: "error",
            });
            return toolError(`Tether could not store that memory: ${message}`);
          }
        },
      },
      {
        name: "retrieve_context",
        description:
          "Retrieve the user context most relevant to the current task from Tether, ranked by relevance with the reason each memory matched.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "What context is needed right now." },
            source_filter: {
              type: "string",
              description: "Optional: only return memories written by this site.",
            },
            limit: { type: "number", description: "Maximum memories to return (default 20)." },
          },
          required: ["query"],
        },
        execute: async (args) => {
          const search = String(args.query ?? "");
          await logActivity({
            channel: "WEBMCP",
            label: "retrieve_context",
            detail: `query: "${search}"`,
            origin: "agent",
          });
          try {
            const results = await searchMemories(search, {
              source: typeof args.source_filter === "string" ? args.source_filter : undefined,
              limit: typeof args.limit === "number" ? args.limit : undefined,
            });
            await logActivity({
              channel: "TETHER",
              label: `${results.length} memories returned`,
              detail: results.map((memory) => memory.content).join(" | ") || "no matches",
              origin: "system",
              status: results.length > 0 ? "ok" : "info",
            });
            if (results.length === 0) {
              return toolResult(
                `Tether has no memories matching "${search}". Continue without saved preferences.`,
                { memories: [] },
              );
            }
            return toolResult(
              `Tether returned ${results.length} relevant ${results.length === 1 ? "memory" : "memories"}:\n` +
                results.map((memory) => `- ${memory.content} (${memory.source})`).join("\n"),
              { memories: results },
            );
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : "Retrieval failed.";
            return toolError(
              `Tether couldn't retrieve context: ${message}. The site can continue without saved preferences.`,
            );
          }
        },
      },
      {
        name: "update_context",
        description:
          "Correct or refine a memory that Tether already holds, identified by its id or by matching text.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Id of the memory to update." },
            match: {
              type: "string",
              description: "Alternative to id: text to match against existing memories.",
            },
            content: { type: "string", description: "Replacement content." },
            category: { type: "string", enum: [...CATEGORIES] },
            tags: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
          },
          required: [],
        },
        execute: async (args) => {
          const all = await listMemories();
          const id =
            typeof args.id === "string" && args.id
              ? args.id
              : all.find((memory) =>
                  memory.content.toLowerCase().includes(String(args.match ?? "").toLowerCase()),
                )?.id;

          if (!id) return toolError("No matching memory found to update.");

          await logActivity({
            channel: "WEBMCP",
            label: "update_context",
            detail: `${id.slice(0, 8)} → "${String(args.content ?? "")}"`,
            origin: "agent",
          });

          try {
            const memory = await updateMemory(id, {
              content: typeof args.content === "string" ? args.content : undefined,
              category: typeof args.category === "string" ? args.category : undefined,
              tags: Array.isArray(args.tags) ? args.tags.map(String) : undefined,
              confidence: typeof args.confidence === "number" ? args.confidence : undefined,
            });
            await refresh();
            return toolResult(`Updated memory ${memory.id.slice(0, 8)}: "${memory.content}".`, {
              memory,
            });
          } catch (cause) {
            return toolError(
              `Update failed: ${cause instanceof Error ? cause.message : "unknown error"}`,
            );
          }
        },
      },
      {
        name: "delete_context",
        description:
          "Permanently remove a memory from Tether so no participating site can retrieve it again. Honors the user's decision to forget something.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Id of the memory to delete." },
            match: { type: "string", description: "Alternative to id: text to match." },
          },
          required: [],
        },
        execute: async (args) => {
          const all = await listMemories();
          const target =
            (typeof args.id === "string" && all.find((memory) => memory.id === args.id)) ||
            all.find((memory) =>
              memory.content.toLowerCase().includes(String(args.match ?? "").toLowerCase()),
            );

          if (!target) return toolError("No matching memory found to delete.");

          await logActivity({
            channel: "WEBMCP",
            label: "delete_context",
            detail: `"${target.content}"`,
            origin: "agent",
          });

          try {
            await deleteMemory(target.id);
            await refresh();
            return toolResult(
              `Deleted "${target.content}" from Tether. It is no longer retrievable by any site.`,
              { deleted: target.id },
            );
          } catch (cause) {
            return toolError(
              `Delete failed: ${cause instanceof Error ? cause.message : "unknown error"}`,
            );
          }
        },
      },
    ],
    [refresh],
  );

  const status = useWebMCP(tools);

  /* --- Filtering ------------------------------------------------------ */

  const sources = useMemo(
    () => Array.from(new Set(memories.map((memory) => memory.source))).sort(),
    [memories],
  );

  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    for (const item of CATEGORIES) map.set(item, 0);
    for (const memory of memories) map.set(memory.category, (map.get(memory.category) ?? 0) + 1);
    return map;
  }, [memories]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return memories
      .filter((memory) => (category === "all" ? true : memory.category === category))
      .filter((memory) => (source === "all" ? true : memory.source === source))
      .filter((memory) =>
        needle
          ? memory.content.toLowerCase().includes(needle) ||
            memory.tags.some((tag) => tag.includes(needle)) ||
            memory.source.toLowerCase().includes(needle)
          : true,
      );
  }, [memories, query, category, source]);

  /* --- Human control actions ------------------------------------------ */

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await logActivity({
        channel: "TETHER",
        label: "user deleted memory",
        detail: `"${pendingDelete.content}"`,
        origin: "manual",
      });
      await deleteMemory(pendingDelete.id);
      setBanner(`Removed "${pendingDelete.content}"; participating sites can no longer read it.`);
      setInspecting(null);
      await refresh();
    } catch (cause) {
      setBanner(cause instanceof Error ? cause.message : "Delete failed.");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }, [pendingDelete, refresh]);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(timer);
  }, [banner]);

  const handleSaveEdit = useCallback(
    async (memory: Memory, patch: { content: string }) => {
      const updated = await updateMemory(memory.id, patch);
      setInspecting(updated);
      await refresh();
    },
    [refresh],
  );

  return (
    <div className="w-full">
      {/* Header ------------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className={cn(
              "font-display font-bold tracking-[-0.03em] text-white",
              embedded ? "text-2xl" : "text-3xl sm:text-[2.5rem]",
            )}
          >
            Shared context
          </h2>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            {loading
              ? "Loading memory layer…"
              : `${memories.length} ${memories.length === 1 ? "memory" : "memories"} stored · readable by any participating site you allow`}
          </p>
        </div>
        <WebMCPBadge status={status} surface="Tether" />
      </div>

      {/* Metrics ------------------------------------------------------ */}
      <Panel className="mt-6 flex flex-wrap overflow-hidden">
        <Metric label="Active memories" value={String(memories.length)} tone="orange" />
        <Metric label="Connected tools" value={String(status.toolNames.length)} />
        <Metric label="Protocol" value="WebMCP v1.0" />
        <Metric
          label="Layer status"
          value={error ? "DEGRADED" : "ONLINE"}
          tone={error ? undefined : "green"}
        />
      </Panel>

      {/* Filters ------------------------------------------------------ */}
      <div className="mt-6 space-y-3">
        <label className="relative block">
          <span className="sr-only">Search memories</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525B]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search memories… (e.g. typescript, dark UI)"
            className="w-full rounded-lg border border-[#1F1F1F] bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#52525B] outline-none transition-colors focus:border-accent-orange"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPill active={category === "all"} onClick={() => setCategory("all")}>
            All ({memories.length})
          </FilterPill>
          {CATEGORIES.map((item) => (
            <FilterPill
              key={item}
              active={category === item}
              onClick={() => setCategory(item)}
              disabled={(counts.get(item) ?? 0) === 0}
            >
              {item} ({counts.get(item) ?? 0})
            </FilterPill>
          ))}
        </div>

        {sources.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
              Source
            </span>
            <FilterPill active={source === "all"} onClick={() => setSource("all")}>
              All sources
            </FilterPill>
            {sources.map((item) => (
              <FilterPill key={item} active={source === item} onClick={() => setSource(item)}>
                {item}
              </FilterPill>
            ))}
          </div>
        ) : null}
      </div>

      {/* Banner ------------------------------------------------------- */}
      {banner ? (
        <p
          role="status"
          className="mt-5 animate-fade-up rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.07)] px-4 py-3 text-sm text-signal-red"
        >
          {banner}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.07)] px-4 py-3 text-sm text-signal-amber">
          Tether couldn&apos;t reach the memory layer. {error}
        </p>
      ) : null}

      {status.checked && !status.supported ? <EnvironmentNotice className="mt-6" /> : null}

      {/* Human-authored memories -------------------------------------- */}
      <div className="mt-6">
        <AddMemoryPanel
          onAdded={refresh}
          disabled={!status.supported}
          disabledReason={GATE_MESSAGE}
        />
      </div>

      {/* Feed --------------------------------------------------------- */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-xl border border-[#1F1F1F] bg-surface-1"
              />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <Panel className="p-10 text-center">
            <p className="text-sm text-[#A1A1AA]">
              No memories match those filters.{" "}
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setSource("all");
                }}
                className="text-accent-orange underline underline-offset-4"
              >
                Clear filters
              </button>
            </p>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((memory, index) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                index={index}
                onInspect={setInspecting}
                onDelete={setPendingDelete}
                deleting={deletingId === memory.id}
                highlight={recentIds.includes(memory.id) ? "new" : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trust note --------------------------------------------------- */}
      <Panel className="mt-6 flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal-green" aria-hidden />
        <p className="text-xs leading-relaxed text-[#A1A1AA]">
          Tether only exposes memories you have allowed participating sites to use. Every record
          shows the site that wrote it, the tool that created it, and when. Deleting a memory
          removes it from every site immediately; there is no shadow copy.
        </p>
      </Panel>

      <MemoryDrawer
        memory={inspecting}
        onClose={() => setInspecting(null)}
        onDelete={(memory) => setPendingDelete(memory)}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this memory?"
        body={
          <>
            <span className="block rounded-md border border-[#1F1F1F] bg-surface-2 px-3 py-2 font-mono text-xs text-white">
              &ldquo;{pendingDelete?.content}&rdquo;
            </span>
            <span className="mt-3 block">
              This is permanent. No participating site will be able to retrieve it again.
            </span>
          </>
        }
        confirmLabel="Delete permanently"
        busy={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function FilterPill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors",
        active
          ? "border-accent-orange bg-[rgba(255,62,20,0.12)] text-accent-orange"
          : "border-[#1F1F1F] text-[#A1A1AA] hover:border-[#2E2E2E] hover:text-white",
        disabled && "cursor-not-allowed opacity-35 hover:border-[#1F1F1F] hover:text-[#A1A1AA]",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <Panel className="flex flex-col items-center px-6 py-16 text-center">
      <span className="rounded-xl border border-[#2E2E2E] bg-surface-2 p-3">
        <Database className="h-5 w-5 text-[#52525B]" aria-hidden />
      </span>
      <h3 className="mt-5 font-display text-xl font-bold tracking-[-0.02em] text-white">
        No memories yet.
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#A1A1AA]">
        Teach Tether something useful from a participating site. Open DesignLab and ask the agent to
        remember a preference, and it will appear here the moment the tool call lands.
      </p>
      <a href="/designlab" className="mt-6">
        <Button variant="primary" size="md">
          <Wrench className="h-4 w-4" aria-hidden />
          Open DesignLab
        </Button>
      </a>
    </Panel>
  );
}
