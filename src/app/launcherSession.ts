import type Gio from "gi://Gio";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { toggleShortcut } from "@app/shortcutToggle";
import type { Translate } from "@i18n/translate";
import { ChromiumBookmarkCatalog } from "@infra/gnome/chromiumBookmarkCatalog";
import { DuckDuckGoClient } from "@infra/gnome/duckDuckGoClient";
import { GioDirectoryReader } from "@infra/gnome/gioDirectoryReader";
import { GnomeCalculatorConverter } from "@infra/gnome/gnomeCalculatorConverter";
import { SettingsKey } from "@infra/gnome/settingsKeys";
import { ShellAppCatalog } from "@infra/gnome/shellAppCatalog";
import { ShellCommandRunner } from "@infra/gnome/shellCommandRunner";
import { ShellLauncher } from "@infra/gnome/shellLauncher";
import { ShellOverviewProviderCatalog } from "@infra/gnome/shellOverviewProviderCatalog";
import { ShellSystemActionCatalog } from "@infra/gnome/shellSystemActionCatalog";
import { ShellWindowCatalog } from "@infra/gnome/shellWindowCatalog";
import { StClipboard } from "@infra/gnome/stClipboard";
import { createSearchProviders } from "@provider/searchProviderFactory";
import { SearchService } from "@service/searchService";
import { LauncherOverlay } from "@ui/launcherOverlay";
import { LauncherPresenter } from "@ui/launcherPresenter";

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class LauncherSession {
  private readonly apps = new ShellAppCatalog();
  private readonly webResults = new DuckDuckGoClient();
  private readonly unitConverter = new GnomeCalculatorConverter();
  private readonly overviewProviders = new ShellOverviewProviderCatalog();
  private readonly overlay: LauncherOverlay;

  constructor(
    private readonly settings: Gio.Settings,
    private readonly t: Translate,
  ) {
    this.overlay = new LauncherOverlay(t);

    const providers = createSearchProviders({
      apps: this.apps,
      bookmarks: new ChromiumBookmarkCatalog(),
      windows: new ShellWindowCatalog(),
      systemActions: new ShellSystemActionCatalog(),
      directories: new GioDirectoryReader(),
      launcher: new ShellLauncher(),
      clipboard: new StClipboard(),
      commands: new ShellCommandRunner(),
      webResults: this.webResults,
      unitConverter: this.unitConverter,
      overviewProviders: this.overviewProviders,
      settings: {
        searchUrl: () => settings.get_string(SettingsKey.WEB_SEARCH_URL),
        keywordSearches: () =>
          settings.get_value(SettingsKey.KEYWORD_SEARCHES).deepUnpack<Record<string, string>>(),
        searchBookmarks: () => settings.get_boolean(SettingsKey.SEARCH_BOOKMARKS),
      },
      homeDirectory: GLib.get_home_dir(),
      translate: t,
    });
    const service = new SearchService(
      providers,
      () => settings.get_int(SettingsKey.MAX_RESULTS),
      (error) => console.warn(`[launchpad-search] search provider failed: ${describeError(error)}`),
    );
    const presenter = new LauncherPresenter(
      (raw, onUpdate) => service.search(raw, onUpdate),
      this.overlay,
      (error) => this.notifyError(error),
    );
    this.overlay.attach(presenter);
  }

  start(): void {
    Main.wm.addKeybinding(
      SettingsKey.TOGGLE_LAUNCHER,
      this.settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW | Shell.ActionMode.SYSTEM_MODAL,
      () => {
        if (
          !toggleShortcut(
            (Main.actionMode as Shell.ActionMode) === Shell.ActionMode.SYSTEM_MODAL,
            this.overlay.isOpen,
          )
        )
          return;
        this.overlay.toggle();
      },
    );
  }

  stop(): void {
    Main.wm.removeKeybinding(SettingsKey.TOGGLE_LAUNCHER);
    this.overlay.destroy();
    this.apps.destroy();
    this.webResults.destroy();
    this.unitConverter.destroy();
    this.overviewProviders.destroy();
  }

  private notifyError(error: unknown): void {
    Main.notifyError(this.t("Could not open the result"), describeError(error));
  }
}
