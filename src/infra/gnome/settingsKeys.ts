/**
 * Nomes das chaves GSettings da extensão (fonte única; o schema XML usa os mesmos).
 */
export const SettingsKey = {
  TOGGLE_SPOTLIGHT: "toggle-spotlight",
  WEB_SEARCH_URL: "web-search-url",
  MAX_RESULTS: "max-results",
  RELEASED_KEYBINDINGS: "released-keybindings",
} as const;
export type SettingsKey = (typeof SettingsKey)[keyof typeof SettingsKey];
