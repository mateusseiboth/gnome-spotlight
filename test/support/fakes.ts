/**
 * Portas falsas para os provedores: guardam o que foi pedido para as asserções.
 * Nenhuma depende do GNOME.
 */
import type { AppCatalog, AppEntry } from "@domain/apps/appPorts";
import type { Bookmark, BookmarkCatalog } from "@domain/bookmarks/bookmarkPorts";
import type { UnitConverter } from "@domain/calculator/calculatorPorts";
import type { DirectoryReader, FileEntry } from "@domain/files/filePorts";
import type { Clipboard, CommandRunner, UriLauncher } from "@domain/launcher/launcherPorts";
import type {
  OverviewProvider,
  OverviewProviderCatalog,
  OverviewResult,
} from "@domain/overview/overviewPorts";
import type { SystemActionCatalog, SystemActionEntry } from "@domain/system/systemActionPorts";
import type { WebPage, WebResultsClient } from "@domain/web/webPorts";
import type { WindowCatalog, WindowEntry } from "@domain/windows/windowPorts";
import type { Translate } from "@i18n/translate";

export const identity: Translate = (message) => message;

export const makeApp = (
  overrides: Partial<AppEntry> & Pick<AppEntry, "id" | "name">,
): AppEntry => ({
  keywords: [],
  icon: { name: "application-x-executable" },
  usage: 0,
  ...overrides,
});

export const makeAppCatalog = (apps: AppEntry[]) => {
  const launched: string[] = [];
  const catalog: AppCatalog = {
    list: () => apps,
    launch: (id) => {
      launched.push(id);
    },
  };
  return { catalog, launched };
};

export const makeWindowCatalog = (windows: WindowEntry[]) => {
  const focused: string[] = [];
  const catalog: WindowCatalog = {
    list: () => windows,
    focus: (id) => {
      focused.push(id);
    },
  };
  return { catalog, focused };
};

type FakeSystemAction = SystemActionEntry & { readonly keywords: readonly string[] };

export const makeSystemActionCatalog = (actions: FakeSystemAction[]) => {
  const activated: string[] = [];
  const catalog: SystemActionCatalog = {
    findMatching: (term) =>
      actions.filter((action) => action.keywords.some((k) => k.startsWith(term))),
    activate: (id) => {
      activated.push(id);
    },
  };
  return { catalog, activated };
};

export const makeLauncher = () => {
  const uris: string[] = [];
  const paths: string[] = [];
  const launcher: UriLauncher = {
    openUri: (uri) => {
      uris.push(uri);
    },
    openPath: (path) => {
      paths.push(path);
    },
  };
  return { launcher, uris, paths };
};

export const makeClipboard = () => {
  const copied: string[] = [];
  const clipboard: Clipboard = {
    setText: (text) => {
      copied.push(text);
    },
  };
  return { clipboard, copied };
};

export const makeCommandRunner = () => {
  const terminal: string[] = [];
  const background: string[] = [];
  const runner: CommandRunner = {
    runInTerminal: (command) => {
      terminal.push(command);
    },
    runInBackground: (command) => {
      background.push(command);
    },
  };
  return { runner, terminal, background };
};

export const makeDirectoryReader = (tree: Record<string, FileEntry[]>) => {
  const reader: DirectoryReader = {
    list: async (directory) => {
      const entries = tree[directory];
      if (!entries) throw new Error(`pasta inexistente: ${directory}`);
      return entries;
    },
  };
  return { reader };
};

export const makeWebResultsClient = (pages: WebPage[]) => {
  const searched: string[] = [];
  const client: WebResultsClient = {
    find: async (term) => {
      searched.push(term);
      return pages;
    },
  };
  return { client, searched };
};

export const makeUnitConverter = (answers: Record<string, string>) => {
  const asked: string[] = [];
  const converter: UnitConverter = {
    convert: async (expression) => {
      asked.push(expression);
      return answers[expression];
    },
  };
  return { converter, asked };
};

type FakeOverviewResult = Omit<OverviewResult, "activate">;

export const makeOverviewCatalog = (
  providers: Record<string, { name?: string; results: FakeOverviewResult[] | Error }>,
) => {
  const activated: string[] = [];
  const searched: Array<{ provider: string; terms: readonly string[] }> = [];
  const toProvider = ([id, { name, results }]: [
    string,
    { name?: string; results: FakeOverviewResult[] | Error },
  ]): OverviewProvider => ({
    id,
    name,
    search: async (terms) => {
      searched.push({ provider: id, terms });
      if (results instanceof Error) throw results;
      return results.map((item) => ({
        ...item,
        activate: () => {
          activated.push(`${id}:${item.id}`);
        },
      }));
    },
  });
  const catalog: OverviewProviderCatalog = {
    list: () => Object.entries(providers).map(toProvider),
  };
  return { catalog, activated, searched };
};

export const makeBookmarkCatalog = (bookmarks: Bookmark[]) => {
  const catalog: BookmarkCatalog = { list: async () => bookmarks };
  return { catalog };
};
