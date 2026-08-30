/** Single source of truth for outbound links referenced across the UI. */
export const REPO_URL = "https://github.com/Dotman-Bei/Tether";
export const DEVPOST_URL = "https://webmcp.devpost.com";

export const SURFACES = {
  tether: "Tether",
  designlab: "DesignLab",
  devforge: "DevForge",
} as const;

/** The three memories the demo teaches. Used to seed nothing, only to guide. */
export const DEMO_SCRIPT_PROMPT =
  "Remember that I prefer dark interfaces, compact layouts, and TypeScript.";
