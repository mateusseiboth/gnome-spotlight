/**
 * Folha de estilo da busca. UM molde, tokens de cor por variante (strategy map): o CSS
 * claro e o escuro nunca divergem em layout. O build grava `stylesheet-dark.css`,
 * `stylesheet-light.css` e `stylesheet.css` (fallback = escuro), que o Shell escolhe
 * conforme `Main.getStyleVariant()`.
 */

export const ThemeVariant = {
  DARK: "dark",
  LIGHT: "light",
} as const;
export type ThemeVariant = (typeof ThemeVariant)[keyof typeof ThemeVariant];

interface ThemeTokens {
  readonly panelBackground: string;
  readonly panelBorder: string;
  readonly text: string;
  readonly dimText: string;
  readonly hoverBackground: string;
  readonly separator: string;
  readonly shadow: string;
  readonly iconTile: string;
}

const THEME_TOKENS: Record<ThemeVariant, ThemeTokens> = {
  [ThemeVariant.DARK]: {
    panelBackground: "rgba(34, 34, 38, 0.94)",
    panelBorder: "rgba(255, 255, 255, 0.09)",
    text: "#ffffff",
    dimText: "rgba(255, 255, 255, 0.6)",
    hoverBackground: "rgba(255, 255, 255, 0.08)",
    separator: "rgba(255, 255, 255, 0.1)",
    shadow: "rgba(0, 0, 0, 0.5)",
    iconTile: "rgba(255, 255, 255, 0.1)",
  },
  [ThemeVariant.LIGHT]: {
    panelBackground: "rgba(250, 250, 252, 0.95)",
    panelBorder: "rgba(0, 0, 0, 0.08)",
    text: "#1f1f24",
    dimText: "rgba(0, 0, 0, 0.55)",
    hoverBackground: "rgba(0, 0, 0, 0.06)",
    separator: "rgba(0, 0, 0, 0.08)",
    shadow: "rgba(0, 0, 0, 0.22)",
    iconTile: "rgba(0, 0, 0, 0.06)",
  },
};

const TEMPLATE = `
.spotlight-panel {
  width: 640px;
  padding: 8px;
  border-radius: 20px;
  color: {{text}};
  background-color: {{panelBackground}};
  border: 1px solid {{panelBorder}};
  box-shadow: 0 12px 40px 4px {{shadow}};
}

.spotlight-entry {
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

.spotlight-entry-icon {
  icon-size: 18px;
  padding-right: 6px;
  color: {{dimText}};
}

.spotlight-separator {
  height: 1px;
  margin: 4px 6px 6px;
  background-color: {{separator}};
}

.spotlight-scroll {
  max-height: 460px;
}

.spotlight-results {
  spacing: 2px;
}

.spotlight-result {
  padding: 7px 10px;
  border-radius: 12px;
  color: {{text}};
  background-color: transparent;
}

.spotlight-result:hover {
  background-color: {{hoverBackground}};
}

.spotlight-result:selected {
  color: -st-accent-fg-color;
  background-color: -st-accent-color;
}

.spotlight-result-row {
  spacing: 12px;
}

.spotlight-result-icon {
  icon-size: 24px;
  padding: 4px;
  border-radius: 8px;
  background-color: {{iconTile}};
}

.spotlight-result-title {
  font-weight: 600;
}

.spotlight-result-subtitle {
  font-size: 0.82em;
  color: {{dimText}};
}

.spotlight-result-kind {
  font-size: 0.8em;
  color: {{dimText}};
}

.spotlight-result:selected .spotlight-result-subtitle {
  color: -st-accent-fg-color;
}

.spotlight-result:selected .spotlight-result-kind {
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
