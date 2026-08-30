import type { Snippet } from "@/components/landing/CodeViewer";

/**
 * Real excerpts from this repository, shown in the Architecture section.
 * Keep these in sync with the files they name — they are the proof, not decor.
 */
export const SNIPPETS: Snippet[] = [
  {
    id: "register",
    label: "registerTool",
    file: "src/lib/webmcp.ts",
    code: `// Locate the page's model context across every shape currently in the wild.
export function discoverModelContext(): ModelContextHandle | null {
  const candidates = [
    ["navigator.modelContext", navigator.modelContext],
    ["window.modelContext", window.modelContext],
    ["document.modelContext", document.modelContext],
  ];

  for (const [host, candidate] of candidates) {
    if (typeof candidate?.registerTool === "function")
      return { context: candidate, host, api: "registerTool" };
    if (typeof candidate?.provideContext === "function")
      return { context: candidate, host, api: "provideContext" };
  }

  return null; // No agent present. The UI says so; it never fakes a call.
}

export function registerTools(handle, tools) {
  for (const tool of tools) handle.context.registerTool(tool);
}`,
  },
  {
    id: "store",
    label: "store_context",
    file: "src/components/surfaces/TetherControlPlane.tsx",
    code: `{
  name: "store_context",
  description:
    "Persist a useful piece of user context into the Tether shared memory " +
    "layer so other participating websites can retrieve it later.",
  inputSchema: {
    type: "object",
    properties: {
      content: { type: "string", description: "The fact to remember." },
      category: { type: "string", enum: ["preference", "workflow", "project"] },
      tags: { type: "array", items: { type: "string" } },
      source: { type: "string", description: "Website that learned this." },
      confidence: { type: "number", description: "0-1 certainty." },
    },
    required: ["content"],
  },
  execute: async (args) => {
    const { memory, duplicate } = await createMemory({ ...args });
    return toolResult(
      \`Stored in Tether: "\${memory.content}"\`,
      { memory, duplicate },
    );
  },
}`,
  },
  {
    id: "retrieve",
    label: "create_project",
    file: "src/components/surfaces/DevForge.tsx",
    code: `{
  name: "create_project",
  description:
    "Generate a starter project in DevForge. Retrieves the user's " +
    "preferences from Tether first and configures language, theme, and " +
    "layout density from them, so the user never re-enters what they " +
    "already taught another site.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Project name." },
      use_stored_context: { type: "boolean" },
    },
  },
  execute: async (args) => {
    const memories = await searchMemories("preferences for a new project");
    const config = deriveConfig(memories); // language / theme / density
    return toolResult(
      \`Created "\${args.name}" from \${memories.length} Tether memories: \` +
        \`\${config.language}, \${config.theme} UI, \${config.density} layout.\`,
      { config, sourceMemories: memories },
    );
  },
}`,
  },
  {
    id: "api",
    label: "Tether API",
    file: "src/app/api/memory/route.ts",
    code: `export async function POST(request: Request) {
  const parsed = createMemorySchema.safeParse(await request.json());
  if (!parsed.success) return fromZodError(parsed.error);

  const store = getStore();
  const userId = await getUserId();

  // Idempotence: an agent retrying a tool call must not double-write.
  const existing = await store.list(userId);
  const duplicate = existing.find(
    (memory) => memory.content.toLowerCase() === parsed.data.content.toLowerCase(),
  );
  if (duplicate) return NextResponse.json({ memory: duplicate, duplicate: true });

  const memory = await store.create({ userId, ...parsed.data });
  return NextResponse.json({ memory, duplicate: false }, { status: 201 });
}`,
  },
];
