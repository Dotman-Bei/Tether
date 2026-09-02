"use client";

import { Boxes, FileCode2, Sparkles, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button, Panel } from "@/components/ui/primitives";
import { useWebMCP } from "@/hooks/useWebMCP";
import { cn } from "@/lib/cn";
import { logActivity, searchMemories, type RetrievedMemory } from "@/lib/client";
import {
  appliedCount,
  codePreview,
  DEFAULT_CONFIG,
  deriveConfig,
  fileTree,
  installCommand,
  type ProjectConfig,
} from "@/lib/scaffold";
import { toolError, toolResult, type ToolDefinition } from "@/lib/webmcp";

import { AgentConsole, consoleLine, type ConsoleLine } from "./AgentConsole";
import { EnvironmentNotice } from "./EnvironmentNotice";
import { WebMCPBadge } from "./WebMCPBadge";

const SURFACE = "DevForge";
const DEMO_PROMPT = "Create a starter project for me.";
const RETRIEVAL_QUERY =
  "preferences for creating a new project: language, theme, layout, framework, package manager, styling";

/** Human-readable list of only the fields Tether actually decided. */
function appliedLines(config: ProjectConfig): string {
  const labels: Array<[keyof ProjectConfig & string, string]> = [
    ["language", "Language"],
    ["theme", "Theme"],
    ["density", "Layout"],
    ["framework", "Framework"],
    ["packageManager", "Package manager"],
    ["styling", "Styling"],
  ];
  return labels
    .filter(([field]) => config.provenance[field as keyof typeof config.provenance])
    .map(([field, label]) => `\u2022 ${label}: ${String(config[field])}`)
    .join("\n");
}

type Scaffold = {
  name: string;
  config: ProjectConfig;
  /** Whether the retrieved context is currently applied. */
  usingContext: boolean;
};

function ConfigRow({
  label,
  value,
  from,
  applied,
}: {
  label: string;
  value: string;
  from?: string;
  applied: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#1F1F1F] py-3 last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#52525B]">
        {label}
      </span>
      <span className="text-right">
        <span
          className={cn(
            "font-mono text-sm font-semibold",
            applied ? "text-accent-orange" : "text-[#71717A]",
          )}
        >
          {value}
        </span>
        {applied && from ? (
          <span className="mt-0.5 block max-w-[16rem] font-mono text-[10px] leading-snug text-signal-green">
            ← &ldquo;{from}&rdquo;
          </span>
        ) : (
          <span className="mt-0.5 block font-mono text-[10px] text-[#3F3F46]">default</span>
        )}
      </span>
    </div>
  );
}

export function DevForge({ embedded = false }: { embedded?: boolean }) {
  const [projectName, setProjectName] = useState("starter-app");
  const [retrieved, setRetrieved] = useState<RetrievedMemory[] | null>(null);
  const [scaffold, setScaffold] = useState<Scaffold | null>(null);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const append = useCallback((line: ConsoleLine) => setLines((prev) => [...prev, line]), []);

  /* --- Shared retrieval path: agent and human use the same code -------- */

  const retrieve = useCallback(
    async (query: string, origin: "agent" | "manual") => {
      await logActivity({
        channel: "WEBMCP",
        label: "get_user_context",
        detail: `query: "${query}"`,
        origin,
      });
      const results = await searchMemories(query);
      await logActivity({
        channel: "TETHER",
        label: `${results.length} memories → DevForge`,
        detail: results.map((memory) => memory.content).join(" | ") || "no matches",
        origin: "system",
        status: results.length > 0 ? "ok" : "info",
      });
      setRetrieved(results);
      return results;
    },
    [],
  );

  const build = useCallback(
    async (name: string, memories: RetrievedMemory[], origin: "agent" | "manual") => {
      const config = memories.length > 0 ? deriveConfig(memories) : { ...DEFAULT_CONFIG };
      setScaffold({ name, config, usingContext: memories.length > 0 });

      await logActivity({
        channel: "DEVFORGE",
        label: "project scaffolded",
        detail:
          appliedCount(config) > 0
            ? `${name} → ${config.language}, ${config.theme} UI, ${config.density} layout (from ${appliedCount(config)} Tether memories)`
            : `${name} → defaults only; Tether had no relevant context`,
        origin,
        status: appliedCount(config) > 0 ? "ok" : "info",
      });

      return config;
    },
    [],
  );

  /* --- DevForge's WebMCP tools ---------------------------------------- */

  const tools = useMemo<ToolDefinition[]>(
    () => [
      {
        name: "get_user_context",
        description:
          "Fetch the user's stored preferences from Tether that are relevant to setting up a new project, without generating anything yet.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "What context is needed, e.g. 'preferences for a new project'.",
            },
          },
          required: [],
        },
        execute: async (args) => {
          setBusy(true);
          setFailure(null);
          try {
            const query = typeof args.query === "string" && args.query ? args.query : RETRIEVAL_QUERY;
            const results = await retrieve(query, "agent");
            append(
              consoleLine(
                "tool",
                results.length > 0
                  ? `Tether returned ${results.length}:\n${results.map((memory) => `• ${memory.content}  [${memory.source}]`).join("\n")}`
                  : "Tether has no relevant memories yet.",
                "get_user_context",
              ),
            );
            return toolResult(
              results.length > 0
                ? `Tether returned ${results.length} relevant ${results.length === 1 ? "memory" : "memories"}:\n` +
                    results.map((memory) => `- ${memory.content} (${memory.source})`).join("\n")
                : "Tether has no memories relevant to a new project. Proceed with defaults.",
              { memories: results },
            );
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : "unknown error";
            setFailure(message);
            return toolError(
              `Tether couldn't retrieve context: ${message}. DevForge can continue without saved preferences.`,
            );
          } finally {
            setBusy(false);
          }
        },
      },
      {
        name: "create_project",
        description:
          "Generate a starter project in DevForge. Retrieves the user's preferences from Tether first and configures language, theme, layout density, framework, package manager, and styling from them, so the user never re-enters what they already taught another site.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name, e.g. 'starter-app'." },
            use_stored_context: {
              type: "boolean",
              description: "Whether to apply Tether memories. Defaults to true.",
            },
          },
          required: [],
        },
        execute: async (args) => {
          setBusy(true);
          setFailure(null);
          const name =
            typeof args.name === "string" && args.name.trim() ? args.name.trim() : projectName;
          setProjectName(name);
          append(consoleLine("agent", `Checking Tether for stored preferences before scaffolding ${name}.`));

          try {
            const useContext = args.use_stored_context !== false;
            const results = useContext ? await retrieve(RETRIEVAL_QUERY, "agent") : [];
            const config = await build(name, results, "agent");

            append(
              consoleLine(
                "tool",
                results.length > 0
                  ? `Applied ${appliedCount(config)} preferences from Tether:\n` +
                      appliedLines(config)
                  : "No stored context. Scaffolded with DevForge defaults.",
                "create_project",
              ),
            );

            return toolResult(
              results.length > 0
                ? `Created "${name}" configured from ${results.length} Tether ${results.length === 1 ? "memory" : "memories"}. ` +
                    `Applied ${appliedCount(config)} preferences:\n${appliedLines(config)}\nThe user did not re-enter any of this.`
                : `Created "${name}" with DevForge defaults; Tether held no relevant context.`,
              { project: name, config, sourceMemories: results },
            );
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : "unknown error";
            setFailure(message);
            await build(name, [], "agent");
            return toolError(
              `Tether couldn't retrieve context: ${message}. DevForge scaffolded "${name}" with defaults instead.`,
            );
          } finally {
            setBusy(false);
          }
        },
      },
      {
        name: "apply_preferences",
        description:
          "Re-apply or drop the Tether preferences on the project currently open in DevForge, so the user can see exactly which settings came from their shared memory.",
        inputSchema: {
          type: "object",
          properties: {
            use_stored_context: {
              type: "boolean",
              description: "True to apply Tether memories, false to revert to defaults.",
            },
          },
          required: ["use_stored_context"],
        },
        execute: async (args) => {
          if (!scaffold) {
            return toolError("No project is open in DevForge yet. Call create_project first.");
          }
          setBusy(true);
          try {
            const apply = args.use_stored_context !== false;
            await logActivity({
              channel: "WEBMCP",
              label: "apply_preferences",
              detail: apply ? "applying Tether context" : "reverting to defaults",
              origin: "agent",
            });
            const memories = apply ? (retrieved ?? (await retrieve(RETRIEVAL_QUERY, "agent"))) : [];
            const config = await build(scaffold.name, memories, "agent");
            append(
              consoleLine(
                "tool",
                apply
                  ? `Re-applied ${appliedCount(config)} preferences from Tether.`
                  : "Reverted to DevForge defaults; Tether context ignored.",
                "apply_preferences",
              ),
            );
            return toolResult(
              apply
                ? `Applied Tether context: ${config.language}, ${config.theme} UI, ${config.density} layout.`
                : `Reverted "${scaffold.name}" to defaults: ${config.language}, ${config.theme} UI, ${config.density} layout.`,
              { config },
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ],
    [append, build, projectName, retrieve, retrieved, scaffold],
  );

  const status = useWebMCP(tools);

  /* --- Manual run ------------------------------------------------------ */

  const runDemo = useCallback(async () => {
    setBusy(true);
    setFailure(null);
    append(consoleLine("user", DEMO_PROMPT));
    try {
      const results = await retrieve(RETRIEVAL_QUERY, "manual");
      const config = await build(projectName, results, "manual");
      append(
        consoleLine(
          "tool",
          results.length > 0
            ? `Applied ${appliedCount(config)} preferences retrieved from Tether:\n` +
                appliedLines(config)
            : "Tether has no memories yet. Teach it something in DesignLab first.",
          "create_project",
        ),
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "unknown error";
      setFailure(message);
      await build(projectName, [], "manual");
    } finally {
      setBusy(false);
    }
  }, [append, build, projectName, retrieve]);

  const toggleContext = useCallback(
    async (use: boolean) => {
      if (!scaffold) return;
      setBusy(true);
      try {
        await logActivity({
          channel: "DEVFORGE",
          label: use ? "context applied" : "context ignored",
          detail: use ? "user re-applied Tether memories" : "user chose to ignore Tether memories",
          origin: "manual",
          status: use ? "ok" : "info",
        });
        const memories = use ? (retrieved ?? []) : [];
        await build(scaffold.name, memories, "manual");
      } finally {
        setBusy(false);
      }
    },
    [build, retrieved, scaffold],
  );

  const config = scaffold?.config ?? null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg border border-[#2E2E2E] bg-surface-2 p-1.5">
              <Boxes className="h-4 w-4 text-[#38BDF8]" aria-hidden />
            </span>
            <h2
              className={cn(
                "font-display font-bold tracking-[-0.03em] text-white",
                embedded ? "text-2xl" : "text-3xl sm:text-[2.5rem]",
              )}
            >
              DevForge
            </h2>
            <span className="rounded-full border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.1)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
              Context consumer
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-[#A1A1AA]">
            A project scaffolder that has never met you. It asks Tether what you prefer before it
            generates anything, so you never re-enter what DesignLab already learned.
          </p>
        </div>
        <WebMCPBadge status={status} surface="DevForge" />
      </div>

      {status.checked && !status.supported ? <EnvironmentNotice className="mt-6" /> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Panel className="p-5">
            <label
              htmlFor="project-name"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]"
            >
              Project name
            </label>
            <input
              id="project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors focus:border-accent-orange"
            />
            <p className="mt-3 text-xs leading-relaxed text-[#52525B]">
              Notice what is <em className="not-italic text-white">not</em> on this form: no theme
              picker, no language selector, no density setting. DevForge asks Tether instead.
            </p>
          </Panel>

          {/* Retrieval banner: the aha moment --------------------------- */}
          {retrieved !== null ? (
            <div
              className={cn(
                "animate-fade-up rounded-xl border p-4",
                retrieved.length > 0
                  ? "border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.06)]"
                  : "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.06)]",
              )}
            >
              {retrieved.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-signal-green">
                      <Sparkles className="h-4 w-4" aria-hidden />
                      {retrieved.length} Tether {retrieved.length === 1 ? "memory" : "memories"}{" "}
                      injected via WebMCP
                    </p>
                    <code className="font-mono text-[10px] text-[#52525B]">
                      query: &ldquo;{RETRIEVAL_QUERY}&rdquo;
                    </code>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {retrieved.map((memory) => (
                      <li
                        key={memory.id}
                        className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs text-white"
                      >
                        <span className="text-signal-green">→</span>
                        {memory.content}
                        <span className="text-[#52525B]">
                          [{memory.source} · {memory.matchedOn.slice(0, 2).join(", ")}]
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant={scaffold?.usingContext ? "primary" : "outline"}
                      size="sm"
                      onClick={() => toggleContext(true)}
                      disabled={busy || scaffold?.usingContext}
                    >
                      {scaffold?.usingContext ? "✓ Preferences applied" : "Use these preferences"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleContext(false)}
                      disabled={busy || !scaffold?.usingContext}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Ignore
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-signal-amber">
                  Tether has no memories relevant to a new project yet. Teach it something in
                  DesignLab first; DevForge will continue with defaults until then.
                </p>
              )}
            </div>
          ) : null}

          {failure ? (
            <div className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.06)] p-4">
              <p className="text-sm font-semibold text-signal-amber">
                Tether couldn&apos;t retrieve context.
              </p>
              <p className="mt-1 text-xs text-[#A1A1AA]">
                The site can continue without saved preferences. ({failure})
              </p>
            </div>
          ) : null}
        </div>

        <AgentConsole
          surface="DevForge"
          prompt={DEMO_PROMPT}
          lines={lines}
          onRun={runDemo}
          busy={busy}
          runLabel="Run create_project"
          supported={status.supported}
          accent="#38BDF8"
        />
      </div>

      {/* Generated project ------------------------------------------- */}
      {scaffold && config ? (
        <div className="mt-5 grid animate-fade-up gap-5 lg:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                Generated configuration
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                  scaffold.usingContext
                    ? "border-[rgba(16,185,129,0.35)] text-signal-green"
                    : "border-[#2E2E2E] text-[#52525B]",
                )}
              >
                {scaffold.usingContext ? `${appliedCount(config)} from Tether` : "defaults only"}
              </span>
            </div>

            <div className="mt-4">
              <ConfigRow
                label="Language"
                value={config.language === "TypeScript" ? "TypeScript (ESNext)" : "JavaScript (ESM)"}
                from={config.provenance.language}
                applied={Boolean(config.provenance.language)}
              />
              <ConfigRow
                label="UI theme"
                value={config.theme === "Dark" ? "Dark (Obsidian #060606)" : "Light (#FFFFFF)"}
                from={config.provenance.theme}
                applied={Boolean(config.provenance.theme)}
              />
              <ConfigRow
                label="Layout"
                value={
                  config.density === "Compact" ? "Compact density (4px)" : "Comfortable density (8px)"
                }
                from={config.provenance.density}
                applied={Boolean(config.provenance.density)}
              />
              <ConfigRow
                label="Framework"
                value={config.framework}
                from={config.provenance.framework}
                applied={Boolean(config.provenance.framework)}
              />
              <ConfigRow
                label="Package manager"
                value={config.packageManager}
                from={config.provenance.packageManager}
                applied={Boolean(config.provenance.packageManager)}
              />
              <ConfigRow
                label="Styling"
                value={config.styling}
                from={config.provenance.styling}
                applied={Boolean(config.provenance.styling)}
              />
            </div>

            <div className="mt-4 rounded-lg border border-[#1F1F1F] bg-[#080808] px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#52525B]">
                Install
              </p>
              <code className="mt-1 block font-mono text-xs text-signal-green">
                $ {installCommand(config)}
              </code>
            </div>

            <pre className="mt-4 overflow-x-auto rounded-lg border border-[#1F1F1F] bg-[#080808] p-3 font-mono text-[11px] leading-relaxed text-[#71717A]">
              {fileTree(scaffold.name || "starter-app", config).join("\n")}
            </pre>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[#1F1F1F] px-4 py-2.5">
              <FileCode2 className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden />
              <span className="font-mono text-[11px] text-white">
                src/theme/tokens.{config.language === "TypeScript" ? "ts" : "js"}
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-[#3F3F46]">
                generated
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-[#D4D4D8]">
              {codePreview(config)}
            </pre>
            <p className="border-t border-[#1F1F1F] px-4 py-3 text-xs leading-relaxed text-[#52525B]">
              Every value above traces back to a memory the user taught DesignLab. Nothing on this
              page asked them to type it again.
            </p>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
