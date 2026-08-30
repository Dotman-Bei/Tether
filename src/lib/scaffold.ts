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
  framework: "Next.js" | "Remix" | "Vite" | "Astro" | "SvelteKit";
  packageManager: "npm" | "pnpm" | "yarn" | "bun";
  styling: "Tailwind CSS" | "CSS Modules" | "styled-components" | "Plain CSS";
  /** Field → the memory content that decided it. */
  provenance: Partial<Record<ConfigField, string>>;
};

export type ConfigField =
  | "language"
  | "theme"
  | "density"
  | "framework"
  | "packageManager"
  | "styling";

export const DEFAULT_CONFIG: ProjectConfig = {
  language: "JavaScript",
  theme: "Light",
  density: "Comfortable",
  framework: "Next.js",
  packageManager: "npm",
  styling: "Plain CSS",
  provenance: {},
};

/**
 * Ordered detection rules, most specific first.
 *
 * Order genuinely matters: "pnpm" contains no "npm" substring issue here, but
 * a sentence like "I prefer pnpm over npm" must resolve to pnpm, so the
 * narrower token is always tested before the broader one.
 */
const RULES: Record<ConfigField, Array<[RegExp, string]>> = {
  language: [
    [/\btypescript\b|\bts\b/, "TypeScript"],
    [/\bjavascript\b|\bjs\b/, "JavaScript"],
  ],
  theme: [
    [/\bdark\b/, "Dark"],
    [/\blight\b/, "Light"],
  ],
  density: [
    [/\bcompact\b|\bdense\b|\btight\b/, "Compact"],
    [/\bcomfortable\b|\bspacious\b|\broomy\b/, "Comfortable"],
  ],
  framework: [
    [/\bsveltekit\b|\bsvelte\b/, "SvelteKit"],
    [/\bnext\.?js\b|\bnext\b/, "Next.js"],
    [/\bremix\b/, "Remix"],
    [/\bastro\b/, "Astro"],
    [/\bvite\b/, "Vite"],
  ],
  packageManager: [
    [/\bpnpm\b/, "pnpm"],
    [/\bbun\b/, "bun"],
    [/\byarn\b/, "yarn"],
    [/\bnpm\b/, "npm"],
  ],
  styling: [
    [/\btailwind\b/, "Tailwind CSS"],
    [/\bstyled[- ]components\b/, "styled-components"],
    [/\bcss modules?\b/, "CSS Modules"],
    [/\bplain css\b|\bvanilla css\b/, "Plain CSS"],
  ],
};

const FIELDS = Object.keys(RULES) as ConfigField[];

export function deriveConfig(memories: Pick<Memory, "content">[]): ProjectConfig {
  const config: ProjectConfig = { ...DEFAULT_CONFIG, provenance: {} };

  for (const memory of memories) {
    const text = memory.content.toLowerCase();

    for (const field of FIELDS) {
      // First memory to decide a field wins; retrieval already ranked them.
      if (config.provenance[field]) continue;

      for (const [pattern, value] of RULES[field]) {
        if (pattern.test(text)) {
          (config as Record<string, unknown>)[field] = value;
          config.provenance[field] = memory.content;
          break;
        }
      }
    }
  }

  return config;
}

export function appliedCount(config: ProjectConfig): number {
  return Object.keys(config.provenance).length;
}

export function installCommand(config: ProjectConfig): string {
  return config.packageManager === "npm" ? "npm install" : `${config.packageManager} install`;
}

export function fileTree(name: string, config: ProjectConfig): string[] {
  const ext = config.language === "TypeScript" ? "ts" : "js";
  const componentExt = config.language === "TypeScript" ? "tsx" : "jsx";

  const styleFile =
    config.styling === "Tailwind CSS"
      ? `tailwind.config.${ext}`
      : config.styling === "CSS Modules"
        ? `page.module.css`
        : config.styling === "styled-components"
          ? `theme.${ext}`
          : `global.css`;

  const lock =
    config.packageManager === "npm"
      ? "package-lock.json"
      : config.packageManager === "pnpm"
        ? "pnpm-lock.yaml"
        : config.packageManager === "yarn"
          ? "yarn.lock"
          : "bun.lockb";

  return [
    `${name}/`,
    `├── src/`,
    `│   ├── app/`,
    `│   │   ├── layout.${componentExt}`,
    `│   │   └── page.${componentExt}`,
    `│   ├── theme/`,
    `│   │   └── tokens.${ext}`,
    `│   └── styles/`,
    `│       └── ${styleFile}`,
    `├── ${config.language === "TypeScript" ? "tsconfig.json" : "jsconfig.json"}`,
    `├── ${lock}`,
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
    typed ? '  mode: "dark" | "light";' : "",
    typed ? "  spacingUnit: number;" : "",
    typed ? "};" : "",
    "",
    typed ? "export const tokens: ThemeTokens = {" : "export const tokens = {",
    `  mode: "${config.theme.toLowerCase()}",`,
    `  spacingUnit: ${spacing},        // ${config.density.toLowerCase()} density`,
    `  background: "${background}",`,
    `  foreground: "${foreground}",`,
    `  styling: "${config.styling}",`,
    "};",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
