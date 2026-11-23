import type { Bookmark } from "@domain/bookmarks/bookmarkPorts";

export const CHROMIUM_LOCAL_STATE = "Local State";
export const CHROMIUM_BOOKMARK_FILES = ["Bookmarks", "AccountBookmarks"] as const;

const DEFAULT_PROFILE = "Default";
const WEB_ADDRESS = /^https?:\/\//i;

interface ChromiumBrowser {
  readonly desktopIds: readonly string[];
  readonly configDirectory: string;
  readonly flatpakId?: string;
  readonly snapName?: string;
}

const CHROMIUM_BROWSERS: readonly ChromiumBrowser[] = [
  {
    desktopIds: ["google-chrome.desktop", "com.google.Chrome.desktop"],
    configDirectory: "google-chrome",
    flatpakId: "com.google.Chrome",
  },
  {
    desktopIds: ["google-chrome-beta.desktop", "com.google.ChromeBeta.desktop"],
    configDirectory: "google-chrome-beta",
    flatpakId: "com.google.ChromeBeta",
  },
  {
    desktopIds: ["google-chrome-unstable.desktop", "com.google.ChromeDev.desktop"],
    configDirectory: "google-chrome-unstable",
    flatpakId: "com.google.ChromeDev",
  },
  {
    desktopIds: [
      "chromium.desktop",
      "chromium-browser.desktop",
      "org.chromium.Chromium.desktop",
      "chromium_chromium.desktop",
    ],
    configDirectory: "chromium",
    flatpakId: "org.chromium.Chromium",
    snapName: "chromium",
  },
  {
    desktopIds: ["brave-browser.desktop", "com.brave.Browser.desktop", "brave_brave.desktop"],
    configDirectory: "BraveSoftware/Brave-Browser",
    flatpakId: "com.brave.Browser",
    snapName: "brave",
  },
  {
    desktopIds: ["microsoft-edge.desktop", "com.microsoft.Edge.desktop"],
    configDirectory: "microsoft-edge",
    flatpakId: "com.microsoft.Edge",
  },
  {
    desktopIds: ["vivaldi-stable.desktop", "com.vivaldi.Vivaldi.desktop"],
    configDirectory: "vivaldi",
    flatpakId: "com.vivaldi.Vivaldi",
  },
];

export interface UserDirectories {
  readonly home: string;
  readonly config: string;
}

export const listChromiumConfigDirectories = (
  desktopId: string,
  directories: UserDirectories,
): readonly string[] => {
  const browser = CHROMIUM_BROWSERS.find(({ desktopIds }) => desktopIds.includes(desktopId));
  if (!browser) return [];

  const { configDirectory, flatpakId, snapName } = browser;
  const { home, config } = directories;
  return [
    `${config}/${configDirectory}`,
    ...(flatpakId ? [`${home}/.var/app/${flatpakId}/config/${configDirectory}`] : []),
    ...(snapName
      ? [
          `${home}/snap/${snapName}/common/${configDirectory}`,
          `${home}/snap/${snapName}/current/.config/${configDirectory}`,
        ]
      : []),
  ];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const isPlainName = (name: string): boolean =>
  name.length > 0 && !name.includes("/") && name !== "." && name !== "..";

export const resolveChromiumProfile = (localState: string): string => {
  const state = parseJson(localState);
  const profile = isRecord(state) && isRecord(state.profile) ? state.profile : {};
  const lastUsed = profile.last_used;
  return typeof lastUsed === "string" && isPlainName(lastUsed) ? lastUsed : DEFAULT_PROFILE;
};

const collectBookmarks = (node: unknown, found: Bookmark[]): void => {
  if (!isRecord(node)) return;

  const { type, name, url, children } = node;
  if (type === "url" && typeof url === "string" && WEB_ADDRESS.test(url)) {
    found.push({ title: typeof name === "string" && name ? name : url, url });
  }

  if (Array.isArray(children)) {
    for (const child of children) collectBookmarks(child, found);
  }
};

export const parseChromiumBookmarks = (content: string): readonly Bookmark[] => {
  const document = parseJson(content);
  if (!isRecord(document) || !isRecord(document.roots)) return [];

  const found: Bookmark[] = [];
  for (const root of Object.values(document.roots)) collectBookmarks(root, found);
  return found;
};

export const mergeBookmarks = (lists: readonly (readonly Bookmark[])[]): readonly Bookmark[] => {
  const byUrl = new Map<string, Bookmark>();
  for (const bookmark of lists.flat()) {
    if (!byUrl.has(bookmark.url)) byUrl.set(bookmark.url, bookmark);
  }
  return [...byUrl.values()];
};
