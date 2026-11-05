export const SettingsKey = {
  TOGGLE_LAUNCHER: "toggle-launcher",
  WEB_SEARCH_URL: "web-search-url",
  MAX_RESULTS: "max-results",
} as const;
export type SettingsKey = (typeof SettingsKey)[keyof typeof SettingsKey];
