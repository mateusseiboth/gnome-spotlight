/**
 * Factory dos provedores de busca. Fonte nova = um provedor novo + uma linha aqui.
 */
import type { AppCatalog } from "@domain/apps/appPorts";
import type { DirectoryReader } from "@domain/files/filePorts";
import type {
  Clipboard,
  CommandRunner,
  SearchSettings,
  UriLauncher,
} from "@domain/launcher/launcherPorts";
import type { SearchProvider } from "@domain/search/searchProvider";
import type { SystemActionCatalog } from "@domain/system/systemActionPorts";
import type { WindowCatalog } from "@domain/windows/windowPorts";
import type { Translate } from "@i18n/translate";
import { AppSearchProvider } from "@provider/appSearchProvider";
import { CalculatorSearchProvider } from "@provider/calculatorSearchProvider";
import { CommandSearchProvider } from "@provider/commandSearchProvider";
import { FileSearchProvider } from "@provider/fileSearchProvider";
import { SystemActionSearchProvider } from "@provider/systemActionSearchProvider";
import { WebSearchProvider } from "@provider/webSearchProvider";
import { WindowSearchProvider } from "@provider/windowSearchProvider";

export interface SearchProviderDependencies {
  readonly apps: AppCatalog;
  readonly windows: WindowCatalog;
  readonly systemActions: SystemActionCatalog;
  readonly directories: DirectoryReader;
  readonly launcher: UriLauncher;
  readonly clipboard: Clipboard;
  readonly commands: CommandRunner;
  readonly settings: SearchSettings;
  readonly homeDirectory: string;
  readonly translate: Translate;
}

export const createSearchProviders = (deps: SearchProviderDependencies): SearchProvider[] => [
  new AppSearchProvider(deps.apps),
  new WindowSearchProvider(deps.windows, deps.translate),
  new CalculatorSearchProvider(deps.clipboard, deps.translate),
  new SystemActionSearchProvider(deps.systemActions),
  new CommandSearchProvider(deps.commands, deps.translate),
  new FileSearchProvider(deps.directories, deps.launcher, deps.homeDirectory),
  new WebSearchProvider(deps.launcher, deps.settings, deps.translate),
];
