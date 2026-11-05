export const ThemeVariant = {
  DARK: "dark",
  LIGHT: "light",
} as const;
export type ThemeVariant = (typeof ThemeVariant)[keyof typeof ThemeVariant];

interface ThemeTokens {
  readonly panelGlass: string;
  readonly panelSolid: string;
  readonly panelBorder: string;
  readonly text: string;
  readonly dimText: string;
  readonly hoverBackground: string;
  readonly separator: string;
  readonly iconTile: string;
}

const THEME_TOKENS: Record<ThemeVariant, ThemeTokens> = {
  [ThemeVariant.DARK]: {
    panelGlass: "rgba(30, 30, 34, 0.55)",
    panelSolid: "rgba(36, 36, 40, 0.97)",
    panelBorder: "rgba(255, 255, 255, 0.09)",
    text: "#ffffff",
    dimText: "rgba(255, 255, 255, 0.6)",
    hoverBackground: "rgba(255, 255, 255, 0.08)",
    separator: "rgba(255, 255, 255, 0.1)",
    iconTile: "rgba(255, 255, 255, 0.1)",
  },
  [ThemeVariant.LIGHT]: {
    panelGlass: "rgba(250, 250, 252, 0.6)",
    panelSolid: "rgba(250, 250, 252, 0.97)",
    panelBorder: "rgba(0, 0, 0, 0.08)",
    text: "#1f1f24",
    dimText: "rgba(0, 0, 0, 0.55)",
    hoverBackground: "rgba(0, 0, 0, 0.06)",
    separator: "rgba(0, 0, 0, 0.08)",
    iconTile: "rgba(0, 0, 0, 0.06)",
  },
};

const TEMPLATE = `
.launcher-panel {
  width: 640px;
  padding: 8px;
  border-radius: 18px;
  color: {{text}};
  border: 1px solid {{panelBorder}};
}

.launcher-panel-glass {
  background-color: {{panelGlass}};
}

.launcher-panel-solid {
  background-color: {{panelSolid}};
}

.launcher-entry {
  padding: 10px 12px;
  font-size: 1.3em;
  color: {{text}};
  caret-color: {{text}};
  selection-background-color: -st-accent-color;
  selected-color: -st-accent-fg-color;
  background-color: transparent;
  border: none;
  box-shadow: none;
}

.launcher-entry-icon {
  icon-size: 18px;
  padding-right: 6px;
  color: {{dimText}};
}

.launcher-separator {
  height: 1px;
  margin: 4px 6px 6px;
  background-color: {{separator}};
}

.launcher-scroll {
  max-height: 460px;
}

.launcher-results {
  spacing: 2px;
}

.launcher-result {
  padding: 7px 10px;
  border-radius: 12px;
  color: {{text}};
  background-color: transparent;
}

.launcher-result:hover {
  background-color: {{hoverBackground}};
}

.launcher-result:selected {
  color: -st-accent-fg-color;
  background-color: -st-accent-color;
}

.launcher-result-row {
  spacing: 12px;
}

.launcher-result-icon {
  icon-size: 24px;
  padding: 4px;
  border-radius: 8px;
  background-color: {{iconTile}};
}

.launcher-result-title {
  font-weight: 600;
}

.launcher-result-subtitle {
  font-size: 0.82em;
  color: {{dimText}};
}

.launcher-result-kind {
  font-size: 0.8em;
  color: {{dimText}};
}

.launcher-result:selected .launcher-result-subtitle {
  color: -st-accent-fg-color;
}

.launcher-result:selected .launcher-result-kind {
  color: -st-accent-fg-color;
}
`;

export const buildStylesheet = (variant: ThemeVariant): string => {
  const tokens = THEME_TOKENS[variant];
  return TEMPLATE.replace(
    /\{\{(\w+)\}\}/g,
    (_, name: keyof ThemeTokens) => tokens[name],
  ).trimStart();
};
