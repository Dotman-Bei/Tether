"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  discoverModelContext,
  registerTools,
  type ModelContextHandle,
  type ToolDefinition,
  type ToolResult,
} from "@/lib/webmcp";

export type WebMCPStatus = {
  /** True only when a real model context was found. Never optimistic. */
  supported: boolean;
  /** Null until the first client-side check completes (avoids SSR flicker). */
  checked: boolean;
  host: ModelContextHandle["host"] | null;
  api: ModelContextHandle["api"] | null;
  toolNames: string[];
};

/**
 * Register a surface's WebMCP tools for the lifetime of the component.
 *
 * Tool handlers are held in a ref so they always see current React state
 * without forcing a re-registration on every render; an agent that discovered
 * `create_project` at page load keeps calling the same live handler.
 */
export function useWebMCP(tools: ToolDefinition[]): WebMCPStatus & {
  /**
   * Run a registered tool directly. Used by the on-page "run this tool"
   * controls, which execute the exact same handler an agent would call.
   */
  invoke: (name: string, args?: Record<string, unknown>) => Promise<ToolResult>;
} {
  const [status, setStatus] = useState<WebMCPStatus>({
    supported: false,
    checked: false,
    host: null,
    api: null,
    toolNames: [],
  });

  const toolsRef = useRef(tools);
  toolsRef.current = tools;

  // Registration keys off tool names only: the handler identity is proxied.
  const names = useMemo(() => tools.map((tool) => tool.name).join("|"), [tools]);

  useEffect(() => {
    const handle = discoverModelContext();
    const toolNames = names ? names.split("|") : [];

    if (!handle) {
      setStatus({ supported: false, checked: true, host: null, api: null, toolNames });
      return;
    }

    // Stable proxies: the shape an agent sees never changes, but every call
    // dispatches into the freshest handler this component rendered.
    const proxies: ToolDefinition[] = toolNames.map((name) => ({
      name,
      get description() {
        return toolsRef.current.find((tool) => tool.name === name)?.description ?? "";
      },
      get inputSchema() {
        return (
          toolsRef.current.find((tool) => tool.name === name)?.inputSchema ?? {
            type: "object" as const,
            properties: {},
          }
        );
      },
      execute: async (args: Record<string, unknown>) => {
        const tool = toolsRef.current.find((candidate) => candidate.name === name);
        if (!tool) {
          return {
            content: [{ type: "text" as const, text: `Tool "${name}" is no longer available.` }],
            isError: true,
          };
        }
        return tool.execute(args ?? {});
      },
    }));

    const teardown = registerTools(handle, proxies);
    setStatus({ supported: true, checked: true, host: handle.host, api: handle.api, toolNames });

    return teardown;
  }, [names]);

  const invoke = useCallback(async (name: string, args: Record<string, unknown> = {}) => {
    const tool = toolsRef.current.find((candidate) => candidate.name === name);
    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool "${name}".` }],
        isError: true,
      };
    }
    return tool.execute(args);
  }, []);

  return { ...status, invoke };
}
