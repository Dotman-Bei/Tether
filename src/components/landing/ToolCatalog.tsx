"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

export type CatalogTool = {
  name: string;
  surface: string;
  purpose: string;
  input: string;
  output: string;
};

export const TOOL_CATALOG: CatalogTool[] = [
  {
    name: "store_context",
    surface: "Tether",
    purpose: "Persist a structured memory so any participating site can retrieve it later.",
    input: "{ content, category?, tags?, source?, confidence? }",
    output: "{ memory, duplicate }",
  },
  {
    name: "retrieve_context",
    surface: "Tether",
    purpose: "Return the memories most relevant to a query, ranked, with the reason each matched.",
    input: "{ query, source_filter?, limit? }",
    output: "{ memories: [{ ...memory, relevance, matchedOn }] }",
  },
  {
    name: "update_context",
    surface: "Tether",
    purpose: "Correct or refine a memory Tether already holds, by id or by matching text.",
    input: "{ id? , match?, content?, category?, tags?, confidence? }",
    output: "{ memory }",
  },
  {
    name: "delete_context",
    surface: "Tether",
    purpose: "Permanently remove a memory so no site can retrieve it again.",
    input: "{ id? , match? }",
    output: "{ deleted }",
  },
  {
    name: "save_preference",
    surface: "DesignLab",
    purpose: "Apply a design preference locally and write it to Tether in one call.",
    input: "{ theme?, density?, language? }",
    output: "{ preferences, stored }",
  },
  {
    name: "get_preferences",
    surface: "DesignLab",
    purpose: "Read what DesignLab has applied plus what Tether already knows.",
    input: "{}",
    output: "{ applied, remembered }",
  },
  {
    name: "get_user_context",
    surface: "DevForge",
    purpose: "Fetch project-relevant preferences from Tether without generating anything yet.",
    input: "{ query? }",
    output: "{ memories }",
  },
  {
    name: "create_project",
    surface: "DevForge",
    purpose:
      "Scaffold a project configured from stored preferences: language, theme, density, framework, package manager, styling.",
    input: "{ name?, use_stored_context? }",
    output: "{ project, config, sourceMemories }",
  },
  {
    name: "apply_preferences",
    surface: "DevForge",
    purpose: "Apply or drop Tether context on the open project, so provenance is visible.",
    input: "{ use_stored_context }",
    output: "{ config }",
  },
];

const SURFACE_TONE: Record<string, string> = {
  Tether: "border-[rgba(255,62,20,0.35)] bg-[rgba(255,62,20,0.08)] text-accent-orange",
  DesignLab: "border-[rgba(129,140,248,0.3)] bg-[rgba(129,140,248,0.1)] text-[#818CF8]",
  DevForge: "border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.1)] text-[#38BDF8]",
};

export function ToolCatalog() {
  const [filter, setFilter] = useState<string>("all");
  const surfaces = ["all", "Tether", "DesignLab", "DevForge"];
  const visible = TOOL_CATALOG.filter((tool) => filter === "all" || tool.surface === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {surfaces.map((surface) => (
          <button
            key={surface}
            type="button"
            onClick={() => setFilter(surface)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
              filter === surface
                ? "border-accent-orange bg-[rgba(255,62,20,0.12)] text-accent-orange"
                : "border-[#1F1F1F] text-[#A1A1AA] hover:border-[#2E2E2E] hover:text-white",
            )}
          >
            {surface === "all" ? `All (${TOOL_CATALOG.length})` : surface}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {visible.map((tool) => (
          <article key={tool.name} className="rounded-xl border border-[#1F1F1F] bg-surface-1 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm font-semibold text-white">{tool.name}</code>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]",
                  SURFACE_TONE[tool.surface],
                )}
              >
                {tool.surface}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{tool.purpose}</p>
            <dl className="mt-4 space-y-2 border-t border-[#1F1F1F] pt-3">
              <div className="flex gap-3">
                <dt className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#52525B]">
                  in
                </dt>
                <dd className="min-w-0 break-words font-mono text-[11px] text-[#86EFAC]">
                  {tool.input}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#52525B]">
                  out
                </dt>
                <dd className="min-w-0 break-words font-mono text-[11px] text-[#38BDF8]">
                  {tool.output}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
