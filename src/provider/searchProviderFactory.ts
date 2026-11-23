import type { AppCatalog } from "@domain/apps/appPorts";
import type { BookmarkCatalog } from "@domain/bookmarks/bookmarkPorts";
import type { UnitConverter } from "@domain/calculator/calculatorPorts";
import type { DirectoryReader } from "@domain/files/filePorts";
import type {
  Clipboard,
  CommandRunner,
  SearchSettings,
  UriLauncher,
} from "@domain/launcher/launcherPorts";
import type { OverviewProviderCatalog } from "@domain/overview/overviewPorts";
import type { SearchProvider } from "@domain/search/searchProvider";
import type { SystemActionCatalog } from "@domain/system/systemActionPorts";
import type { WebResultsClient } from "@domain/web/webPorts";
import type { WindowCatalog } from "@domain/windows/windowPorts";
import type { Translate } from "@i18n/translate";
import { AppSearchProvider } from "@provider/appSearchProvider";
import { BookmarkSearchProvider } from "@provider/bookmarkSearchProvider";
import { CalculatorSearchProvider } from "@provider/calculatorSearchProvider";
import { CommandSearchProvider } from "@provider/commandSearchProvider";
import { FileSearchProvider } from "@provider/fileSearchProvider";
import { KeywordSearchProvider } from "@provider/keywordSearchProvider";
import { isCoveredByLauncher, OverviewSearchProvider } from "@provider/overviewSearchProvider";
import { SystemActionSearchProvider } from "@provider/systemActionSearchProvider";
import { UnitConversionSearchProvider } from "@provider/unitConversionSearchProvider";
import { WebResultsSearchProvider } from "@provider/webResultsSearchProvider";
import { WebSearchProvider } from "@provider/webSearchProvider";
import { WindowSearchProvider } from "@provider/windowSearchProvider";

export interface SearchProviderDependencies {
  readonly apps: AppCatalog;
  readonly bookmarks: BookmarkCatalog;
  readonly windows: WindowCatalog;
  readonly systemActions: SystemActionCatalog;
  readonly directories: DirectoryReader;
  readonly launcher: UriLauncher;
  readonly clipboard: Clipboard;
  readonly commands: CommandRunner;
  readonly webResults: WebResultsClient;
  readonly unitConverter: UnitConverter;
  readonly overviewProviders: OverviewProviderCatalog;
  readonly settings: SearchSettings;
  readonly homeDirectory: string;
  readonly translate: Translate;
}

export const createSearchProviders = (
  deps: SearchProviderDependencies,
): (() => readonly SearchProvider[]) => {
  const launcherProviders: readonly SearchProvider[] = [
    new AppSearchProvider(deps.apps),
    new WindowSearchProvider(deps.windows, deps.translate),
    new CalculatorSearchProvider(deps.clipboard, deps.translate),
    new UnitConversionSearchProvider(deps.unitConverter, deps.clipboard, deps.translate),
    new SystemActionSearchProvider(deps.systemActions),
    new CommandSearchProvider(deps.commands, deps.translate),
    new BookmarkSearchProvider(deps.bookmarks, deps.launcher, deps.settings),
    new FileSearchProvider(deps.directories, deps.launcher, deps.homeDirectory),
    new WebSearchProvider(deps.launcher, deps.settings, deps.translate),
    new KeywordSearchProvider(deps.launcher, deps.settings, deps.translate),
    new WebResultsSearchProvider(deps.webResults, deps.launcher),
  ];

  return () => [
    ...launcherProviders,
    ...deps.overviewProviders
      .list()
      .filter((provider) => !isCoveredByLauncher(provider.id))
      .map((provider) => new OverviewSearchProvider(provider)),
  ];
};
