import type Gio from "gi://Gio";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import type { Translate } from "@i18n/translate";
import { GioDirectoryReader } from "@infra/gnome/gioDirectoryReader";
import { SettingsKey } from "@infra/gnome/settingsKeys";
import { ShellAppCatalog } from "@infra/gnome/shellAppCatalog";
import { ShellCommandRunner } from "@infra/gnome/shellCommandRunner";
import { ShellLauncher } from "@infra/gnome/shellLauncher";
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
  private readonly overlay: LauncherOverlay;

  constructor(
    private readonly settings: Gio.Settings,
    private readonly t: Translate,
  ) {
    this.overlay = new LauncherOverlay(t);

    const providers = createSearchProviders({
      apps: this.apps,
      windows: new ShellWindowCatalog(),
      systemActions: new ShellSystemActionCatalog(),
      directories: new GioDirectoryReader(),
      launcher: new ShellLauncher(),
      clipboard: new StClipboard(),
      commands: new ShellCommandRunner(),
      settings: { searchUrl: () => settings.get_string(SettingsKey.WEB_SEARCH_URL) },
      homeDirectory: GLib.get_home_dir(),
      translate: t,
    });
    const service = new SearchService(
      providers,
      () => settings.get_int(SettingsKey.MAX_RESULTS),
      (error) => console.warn(`[launchpad-search] search provider failed: ${describeError(error)}`),
    );
    const presenter = new LauncherPresenter(
      (raw) => service.search(raw),
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
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
      () => this.overlay.toggle(),
    );
  }

  stop(): void {
    Main.wm.removeKeybinding(SettingsKey.TOGGLE_LAUNCHER);
    this.overlay.destroy();
    this.apps.destroy();
  }

  private notifyError(error: unknown): void {
    Main.notifyError(this.t("Could not open the result"), describeError(error));
  }
}
