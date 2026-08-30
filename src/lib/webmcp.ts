/**
 * WebMCP adapter.
 *
 * WebMCP is still moving: different builds of the agentic-browser prototypes
 * hang the model context off `navigator`, `window`, or `document`, and expose
 * either `registerTool` (imperative, one tool at a time) or `provideContext`
 * (declarative, whole tool list). This module normalises all of that behind
 * one surface so the product code can just declare tools.
 *
 * It never pretends. If no model context exists, `discoverModelContext`
 * returns null and the UI says so.
 */

export type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
};

/** MCP-shaped tool result: human-readable content plus machine-readable data. */
export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
  isError?: boolean;
};

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};

type ModelContext = {
  registerTool?: (tool: unknown) => unknown;
  provideContext?: (context: { tools: unknown[] }) => unknown;
  unregisterTool?: (name: string) => unknown;
};

export type ModelContextHandle = {
  context: ModelContext;
  /** Where we found it, shown in the UI so the environment is never a mystery. */
  host: "navigator.modelContext" | "window.modelContext" | "document.modelContext";
  api: "registerTool" | "provideContext";
};

/** Locate the page's model context across every shape currently in the wild. */
export function discoverModelContext(): ModelContextHandle | null {
  if (typeof window === "undefined") return null;

  const candidates: Array<[ModelContextHandle["host"], unknown]> = [
    ["navigator.modelContext", (navigator as unknown as { modelContext?: unknown }).modelContext],
    ["window.modelContext", (window as unknown as { modelContext?: unknown }).modelContext],
    ["document.modelContext", (document as unknown as { modelContext?: unknown }).modelContext],
  ];

  for (const [host, candidate] of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const context = candidate as ModelContext;
    if (typeof context.registerTool === "function") return { context, host, api: "registerTool" };
    if (typeof context.provideContext === "function") return { context, host, api: "provideContext" };
  }

  return null;
}

/** Build a successful tool result carrying both prose and structured data. */
export function toolResult(text: string, structured?: unknown): ToolResult {
  return {
    content: [{ type: "text", text }],
    ...(structured === undefined ? {} : { structuredContent: structured }),
  };
}

/** Build a failure result. Agents read the text; the flag stops silent success. */
export function toolError(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

/**
 * Register a set of tools with the page's model context.
 * Returns a teardown function that removes whatever was registered.
 */
export function registerTools(
  handle: ModelContextHandle,
  tools: ToolDefinition[],
): () => void {
  const { context, api } = handle;

  if (api === "provideContext") {
    context.provideContext?.({ tools });
    // Declarative API: hand back an empty tool list to tear down.
    return () => {
      try {
        context.provideContext?.({ tools: [] });
      } catch {
        /* teardown is best-effort */
      }
    };
  }

  const teardowns: Array<() => void> = [];

  for (const tool of tools) {
    try {
      const returned = context.registerTool?.(tool);
      if (typeof returned === "function") {
        teardowns.push(returned as () => void);
      } else if (typeof context.unregisterTool === "function") {
        teardowns.push(() => context.unregisterTool?.(tool.name));
      }
    } catch (error) {
      console.error(`[tether] failed to register tool "${tool.name}"`, error);
    }
  }

  return () => {
    for (const teardown of teardowns) {
      try {
        teardown();
      } catch {
        /* teardown is best-effort */
      }
    }
  };
}
