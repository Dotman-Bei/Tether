import type { Memory } from "./types";

/**
 * Turn retrieved memories into a concrete project configuration.
 *
 * Deliberately transparent: each field records *which* memory produced it, so
 * DevForge can show the user the provenance of every applied setting instead
 * of asserting "we used your preferences".
 */

export type ProjectConfig = {
  language: "TypeScript" | "JavaScript";
  theme: "Dark" | "Light";
  density: "Compact" | "Comfortable";
  /** Field → the memory content that decided it. */
  provenance: Partial<Record<"language" | "theme" | "density", string>>;
};

export const DEFAULT_CONFIG: ProjectConfig = {
  language: "JavaScript",
  theme: "Light",
  density: "Comfortable",
  provenance: {},
};

export function deriveConfig(memories: Pick<Memory, "content">[]): ProjectConfig {
  const config: ProjectConfig = { ...DEFAULT_CONFIG, provenance: {} };

  for (const memory of memories) {
    const text = memory.content.toLowerCase();

    if (!config.provenance.language) {
      if (text.includes("typescript")) {
        config.language = "TypeScript";
        config.provenance.language = memory.content;
      } else if (text.includes("javascript")) {
        config.language = "JavaScript";
        config.provenance.language = memory.content;
      }
    }

    if (!config.provenance.theme) {
      if (text.includes("dark")) {
        config.theme = "Dark";
        config.provenance.theme = memory.content;
      } else if (text.includes("light")) {
        config.theme = "Light";
        config.provenance.theme = memory.content;
      }
    }

    if (!config.provenance.density) {
      if (text.includes("compact")) {
        config.density = "Compact";
        config.provenance.density = memory.content;
      } else if (text.includes("comfortable") || text.includes("spacious")) {
        config.density = "Comfortable";
        config.provenance.density = memory.content;
      }
    }
  }

  return config;
}

export function appliedCount(config: ProjectConfig): number {
  return Object.keys(config.provenance).length;
}

export function fileTree(name: string, config: ProjectConfig): string[] {
  const ext = config.language === "TypeScript" ? "ts" : "js";
  const componentExt = config.language === "TypeScript" ? "tsx" : "jsx";
  return [
    `${name}/`,
    `├── src/`,
    `│   ├── app/`,
    `│   │   ├── layout.${componentExt}`,
    `│   │   └── page.${componentExt}`,
    `│   ├── theme/`,
    `│   │   └── tokens.${ext}`,
    `│   └── lib/`,
    `│       └── config.${ext}`,
    `├── ${config.language === "TypeScript" ? "tsconfig.json" : "jsconfig.json"}`,
    `├── tailwind.config.${ext}`,
    `└── package.json`,
  ];
}

/** The generated theme token file — visibly built from the retrieved values. */
export function codePreview(config: ProjectConfig): string {
  const typed = config.language === "TypeScript";
  const spacing = config.density === "Compact" ? "4" : "8";
  const background = config.theme === "Dark" ? "#060606" : "#FFFFFF";
  const foreground = config.theme === "Dark" ? "#FFFFFF" : "#18181B";

  return [
    typed ? "export type ThemeTokens = {" : "/** @typedef {object} ThemeTokens */",
    typed ? "  mode: \"dark\" | \"light\";" : "",
    typed ? "  spacingUnit: number;" : "",
    typed ? "};" : "",
    "",
    typed
      ? "export const tokens: ThemeTokens = {"
      : "export const tokens = {",
    `  mode: "${config.theme.toLowerCase()}",`,
    `  spacingUnit: ${spacing},        // ${config.density.toLowerCase()} density`,
    `  background: "${background}",`,
    `  foreground: "${foreground}",`,
    "};",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
