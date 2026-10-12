/**
 * Folha de estilo da busca. UM molde, tokens de cor por variante (strategy map): o CSS
 * claro e o escuro nunca divergem em layout. O build grava `stylesheet-dark.css`,
 * `stylesheet-light.css` e `stylesheet.css` (fallback = escuro), que o Shell escolhe
 * conforme `Main.getStyleVariant()`.
 *
 * O fundo do painel vem de duas classes: `spotlight-panel-glass` (translúcido, com o Blur
 * my Shell desfocando atrás) e `spotlight-panel-solid` (sem blur disponível). O raio de
 * 18px é o `dialog-corner-radius` padrão do Blur my Shell: raios diferentes deixam o blur
 * sobrando nos cantos.
 */

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
.spotlight-panel {
  width: 640px;
  padding: 8px;
  border-radius: 18px;
  color: {{text}};
  border: 1px solid {{panelBorder}};
}

.spotlight-panel-glass {
  background-color: {{panelGlass}};
}

.spotlight-panel-solid {
  background-color: {{panelSolid}};
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
