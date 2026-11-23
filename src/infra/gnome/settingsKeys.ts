export const SettingsKey = {
  TOGGLE_LAUNCHER: "toggle-launcher",
  WEB_SEARCH_URL: "web-search-url",
  MAX_RESULTS: "max-results",
  KEYWORD_SEARCHES: "keyword-searches",
  SEARCH_BOOKMARKS: "search-bookmarks",
} as const;
export type SettingsKey = (typeof SettingsKey)[keyof typeof SettingsKey];
