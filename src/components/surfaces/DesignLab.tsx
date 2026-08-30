"use client";

import { Check, Layout, Palette, Code2, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button, Panel } from "@/components/ui/primitives";
import { useWebMCP } from "@/hooks/useWebMCP";
import { cn } from "@/lib/cn";
import { createMemory, logActivity, searchMemories } from "@/lib/client";
import { DEMO_SCRIPT_PROMPT } from "@/lib/constants";
import { toolError, toolResult, type ToolDefinition } from "@/lib/webmcp";

import { AgentConsole, consoleLine, type ConsoleLine } from "./AgentConsole";
import { WebMCPBadge } from "./WebMCPBadge";

const SURFACE = "DesignLab";

/* ------------------------------------------------------------------ */
/* Local design-studio state                                           */
/* ------------------------------------------------------------------ */

type Prefs = {
  theme: "dark" | "light";
  density: "compact" | "comfortable";
  language: "TypeScript" | "JavaScript";
};

const DEFAULT_PREFS: Prefs = { theme: "light", density: "comfortable", language: "JavaScript" };

/** Maps a DesignLab setting onto the structured memory Tether will hold. */
const PREF_MEMORY: Record<keyof Prefs, (value: string) => { content: string; tags: string[]; confidence: number }> = {
  theme: (value) => ({
    content: `User prefers ${value} interfaces`,
    tags: ["ui", "design", "theme"],
    confidence: 0.94,
  }),
  density: (value) => ({
    content: `User prefers ${value} layouts`,
    tags: ["layout", "density", "ui"],
    confidence: 0.92,
  }),
  language: (value) => ({
    content: `User prefers ${value} for new projects`,
    tags: ["development", "language"],
    confidence: 0.96,
  }),
};

/** The canvas preview reacts to preferences, so the settings are real product state. */
function StudioCanvas({ prefs }: { prefs: Prefs }) {
  const dark = prefs.theme === "dark";
  const compact = prefs.density === "compact";

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors duration-300",
        dark ? "border-[#2E2E2E] bg-[#0B0B0B]" : "border-[#D4D4D8] bg-[#FAFAFA]",
        compact ? "p-3" : "p-6",
      )}
    >
      <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-4")}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-orange" />
          <span
            className={cn(
              "font-display font-bold tracking-tight",
              compact ? "text-xs" : "text-sm",
              dark ? "text-white" : "text-[#18181B]",
            )}
          >
            Untitled Composition
          </span>
        </div>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
            dark ? "bg-[#1A1A1A] text-[#A1A1AA]" : "bg-[#E4E4E7] text-[#52525B]",
          )}
        >
          {prefs.language}
        </span>
      </div>

      <div className={cn("grid grid-cols-3", compact ? "gap-1.5" : "gap-3")}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={cn(
              "rounded transition-colors duration-300",
              compact ? "h-8" : "h-14",
              dark ? "bg-[#161616]" : "bg-[#E9E9EC]",
              index === 1 && "bg-accent-orange/80",
            )}
          />
        ))}
      </div>

      <div className={cn("space-y-1.5", compact ? "mt-2" : "mt-4")}>
        <div className={cn("rounded", compact ? "h-1.5 w-3/4" : "h-2 w-2/3", dark ? "bg-[#242424]" : "bg-[#D4D4D8]")} />
        <div className={cn("rounded", compact ? "h-1.5 w-1/2" : "h-2 w-1/2", dark ? "bg-[#1C1C1C]" : "bg-[#E4E4E7]")} />
      </div>
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
          {label}
        </span>
      </div>
      <div className="mt-2 flex gap-1.5 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-medium capitalize transition-colors",
              value === option
                ? "bg-surface-3 text-white"
                : "text-[#52525B] hover:text-[#A1A1AA]",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DesignLab({ embedded = false }: { embedded?: boolean }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const append = useCallback((line: ConsoleLine) => setLines((prev) => [...prev, line]), []);

  /**
   * The one function that actually persists preferences. Both the WebMCP tool
   * and the on-page "save" control route through it, so an agent and a human
   * take literally the same code path.
   */
  const persistPreferences = useCallback(
    async (next: Prefs, origin: "agent" | "manual") => {
      const entries = (Object.keys(next) as Array<keyof Prefs>).map((key) => ({
        key,
        ...PREF_MEMORY[key](String(next[key])),
      }));

      const stored: string[] = [];
      for (const entry of entries) {
        await logActivity({
          channel: "WEBMCP",
          label: "save_preference",
          detail: `"${entry.content}"`,
          origin,
        });
        const { memory, duplicate } = await createMemory({
          content: entry.content,
          category: "preference",
          tags: entry.tags,
          source: SURFACE,
          confidence: entry.confidence,
        });
        if (!duplicate) stored.push(memory.content);
      }

      await logActivity({
        channel: "DESIGNLAB",
        label: `${stored.length} preferences written to Tether`,
        detail: stored.join(" | ") || "all preferences already known",
        origin: "system",
        status: stored.length > 0 ? "ok" : "info",
      });

      setSavedCount((count) => count + stored.length);
      return { stored, total: entries.length };
    },
    [],
  );

  /* --- DesignLab's WebMCP tools --------------------------------------- */

  const tools = useMemo<ToolDefinition[]>(
    () => [
      {
        name: "save_preference",
        description:
          "Apply a design preference in DesignLab and persist it to the user's Tether memory layer so other participating sites can use it. Accepts any combination of theme, layout density, and preferred language.",
        inputSchema: {
          type: "object",
          properties: {
            theme: {
              type: "string",
              enum: ["dark", "light"],
              description: "Preferred interface theme.",
            },
            density: {
              type: "string",
              enum: ["compact", "comfortable"],
              description: "Preferred layout density.",
            },
            language: {
              type: "string",
              enum: ["TypeScript", "JavaScript"],
              description: "Preferred programming language for new projects.",
            },
          },
          required: [],
        },
        execute: async (args) => {
          setBusy(true);
          try {
            const next: Prefs = {
              theme: args.theme === "dark" || args.theme === "light" ? args.theme : prefs.theme,
              density:
                args.density === "compact" || args.density === "comfortable"
                  ? args.density
                  : prefs.density,
              language:
                args.language === "TypeScript" || args.language === "JavaScript"
                  ? args.language
                  : prefs.language,
            };

            setPrefs(next);
            append(consoleLine("agent", "Applying preferences in DesignLab and writing them to Tether."));

            const { stored, total } = await persistPreferences(next, "agent");

            append(
              consoleLine(
                "tool",
                stored.length > 0
                  ? `${stored.length} of ${total} preferences stored:\n${stored.map((item) => `• ${item}`).join("\n")}`
                  : "All of these preferences were already in Tether — nothing duplicated.",
                "save_preference",
              ),
            );

            return toolResult(
              `DesignLab is now set to ${next.theme} theme, ${next.density} layout, ${next.language}. ` +
                (stored.length > 0
                  ? `${stored.length} new ${stored.length === 1 ? "memory" : "memories"} written to Tether: ${stored.join("; ")}.`
                  : "Tether already held these preferences."),
              { preferences: next, stored },
            );
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : "unknown error";
            await logActivity({
              channel: "DESIGNLAB",
              label: "save_preference failed",
              detail: message,
              origin: "agent",
              status: "error",
            });
            return toolError(`DesignLab could not save those preferences: ${message}`);
          } finally {
            setBusy(false);
          }
        },
      },
      {
        name: "get_preferences",
        description:
          "Read the design preferences DesignLab currently has applied, along with anything Tether already knows about the user's design and language choices.",
        inputSchema: { type: "object", properties: {} },
        execute: async () => {
          await logActivity({
            channel: "WEBMCP",
            label: "get_preferences",
            detail: "reading local + Tether state",
            origin: "agent",
          });
          try {
            const remembered = await searchMemories("design preferences theme layout language");
            append(
              consoleLine(
                "tool",
                `Local: ${prefs.theme} / ${prefs.density} / ${prefs.language}\nTether: ${
                  remembered.length > 0
                    ? remembered.map((memory) => memory.content).join("; ")
                    : "no stored memories yet"
                }`,
                "get_preferences",
              ),
            );
            return toolResult(
              `DesignLab is set to ${prefs.theme} theme, ${prefs.density} layout, ${prefs.language}. ` +
                `Tether holds ${remembered.length} related ${remembered.length === 1 ? "memory" : "memories"}.`,
              { applied: prefs, remembered },
            );
          } catch (cause) {
            return toolError(
              `Could not read preferences: ${cause instanceof Error ? cause.message : "unknown error"}`,
            );
          }
        },
      },
    ],
    [append, persistPreferences, prefs],
  );

  const status = useWebMCP(tools);

  /* --- Manual (non-agent) run ----------------------------------------- */

  const runDemo = useCallback(async () => {
    setBusy(true);
    append(consoleLine("user", DEMO_SCRIPT_PROMPT));
    const target: Prefs = { theme: "dark", density: "compact", language: "TypeScript" };
    setPrefs(target);
    try {
      const { stored, total } = await persistPreferences(target, "manual");
      append(
        consoleLine(
          "tool",
          stored.length > 0
            ? `${stored.length} of ${total} preferences stored in Tether:\n${stored.map((item) => `• ${item}`).join("\n")}`
            : "All three preferences were already in Tether — nothing duplicated.",
          "save_preference",
        ),
      );
    } catch (cause) {
      append(
        consoleLine(
          "tool",
          `Failed: ${cause instanceof Error ? cause.message : "unknown error"}`,
          "save_preference",
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [append, persistPreferences]);

  const saveCurrent = useCallback(async () => {
    setBusy(true);
    try {
      const { stored } = await persistPreferences(prefs, "manual");
      append(
        consoleLine(
          "tool",
          stored.length > 0
            ? `Stored:\n${stored.map((item) => `• ${item}`).join("\n")}`
            : "Tether already holds these exact preferences.",
          "save_preference",
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [append, persistPreferences, prefs]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg border border-[#2E2E2E] bg-surface-2 p-1.5">
              <Sparkles className="h-4 w-4 text-[#818CF8]" aria-hidden />
            </span>
            <h2
              className={cn(
                "font-display font-bold tracking-[-0.03em] text-white",
                embedded ? "text-2xl" : "text-3xl sm:text-[2.5rem]",
              )}
            >
              DesignLab
            </h2>
            <span className="rounded-full border border-[rgba(129,140,248,0.3)] bg-[rgba(129,140,248,0.1)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#818CF8]">
              Context producer
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-[#A1A1AA]">
            A small design studio. Everything you set here is real product state — and DesignLab
            writes it to Tether through its own WebMCP tool so other sites can use it.
          </p>
        </div>
        <WebMCPBadge status={status} surface="DesignLab" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              Canvas preview
            </span>
            {savedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-signal-green">
                <Check className="h-3 w-3" aria-hidden />
                {savedCount} written to Tether
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            <StudioCanvas prefs={prefs} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ToggleGroup
              label="Theme"
              icon={<Palette className="h-3.5 w-3.5 text-[#52525B]" aria-hidden />}
              value={prefs.theme}
              options={["dark", "light"] as const}
              onChange={(theme) => setPrefs((prev) => ({ ...prev, theme }))}
            />
            <ToggleGroup
              label="Density"
              icon={<Layout className="h-3.5 w-3.5 text-[#52525B]" aria-hidden />}
              value={prefs.density}
              options={["compact", "comfortable"] as const}
              onChange={(density) => setPrefs((prev) => ({ ...prev, density }))}
            />
            <ToggleGroup
              label="Language"
              icon={<Code2 className="h-3.5 w-3.5 text-[#52525B]" aria-hidden />}
              value={prefs.language}
              options={["TypeScript", "JavaScript"] as const}
              onChange={(language) => setPrefs((prev) => ({ ...prev, language }))}
            />
          </div>

          <Button
            variant="outline"
            size="md"
            className="mt-5 w-full"
            onClick={saveCurrent}
            disabled={busy}
          >
            Save these settings to Tether
          </Button>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-[#3F3F46]">
            runs save_preference · manual invocation
          </p>
        </Panel>

        <AgentConsole
          surface="DesignLab"
          prompt={DEMO_SCRIPT_PROMPT}
          lines={lines}
          onRun={runDemo}
          busy={busy}
          runLabel="Run save_preference (all three)"
          supported={status.supported}
          accent="#818CF8"
        />
      </div>
    </div>
  );
}
