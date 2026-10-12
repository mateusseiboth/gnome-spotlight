/**
 * Raiz de composição da busca (factory): monta adaptadores GNOME, provedores, serviço,
 * presenter e view, e cuida do ciclo de vida do atalho. `start()` no `enable()`,
 * `stop()` no `disable()`, e o `stop()` desfaz TUDO o que o `start()` fez.
 */
import type Gio from "gi://Gio";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { formatMessage, type Translate } from "@i18n/translate";
import { GioDirectoryReader } from "@infra/gnome/gioDirectoryReader";
import {
  GSettingsKeybindingStore,
  GSettingsReleasedBindingStore,
} from "@infra/gnome/gsettingsKeybindingStores";
import { SettingsKey } from "@infra/gnome/settingsKeys";
import { ShellAppCatalog } from "@infra/gnome/shellAppCatalog";
import { ShellCommandRunner } from "@infra/gnome/shellCommandRunner";
import { ShellLauncher } from "@infra/gnome/shellLauncher";
import { ShellSystemActionCatalog } from "@infra/gnome/shellSystemActionCatalog";
import { ShellWindowCatalog } from "@infra/gnome/shellWindowCatalog";
import { StClipboard } from "@infra/gnome/stClipboard";
import { createSearchProviders } from "@provider/searchProviderFactory";
import { KeybindingConflictService } from "@service/keybindingConflictService";
import { SearchService } from "@service/searchService";
import { SpotlightOverlay } from "@ui/spotlightOverlay";
import { SpotlightPresenter } from "@ui/spotlightPresenter";

/** Atalhos do GNOME que costumam ocupar Super+Espaço. */
const CONFLICTING_KEYBINDINGS = [
  { schema: "org.gnome.desktop.wm.keybindings", key: "switch-input-source" },
];

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class SpotlightSession {
  private readonly apps = new ShellAppCatalog();
  private readonly overlay: SpotlightOverlay;
  private readonly conflicts: KeybindingConflictService;
  private shortcutChangedId = 0;

  constructor(
    private readonly settings: Gio.Settings,
    private readonly t: Translate,
  ) {
    this.overlay = new SpotlightOverlay(t);
    this.conflicts = new KeybindingConflictService(
      new GSettingsKeybindingStore(),
      new GSettingsReleasedBindingStore(settings),
      CONFLICTING_KEYBINDINGS,
    );

    const launcher = new ShellLauncher();
    const providers = createSearchProviders({
      apps: this.apps,
      windows: new ShellWindowCatalog(),
      systemActions: new ShellSystemActionCatalog(),
      directories: new GioDirectoryReader(),
      launcher,
      clipboard: new StClipboard(),
      commands: new ShellCommandRunner(),
      settings: { searchUrl: () => settings.get_string(SettingsKey.WEB_SEARCH_URL) },
      homeDirectory: GLib.get_home_dir(),
      translate: t,
    });
    const service = new SearchService(
      providers,
      () => settings.get_int(SettingsKey.MAX_RESULTS),
      (error) => console.warn(`[gnome-spotlight] provedor falhou: ${describeError(error)}`),
    );
    const presenter = new SpotlightPresenter(
      (raw) => service.search(raw),
      this.overlay,
      (error) => this.notifyError(error),
    );
    this.overlay.attach(presenter);
  }

  start(): void {
    this.conflicts.release(this.readShortcut());
    Main.wm.addKeybinding(
      SettingsKey.TOGGLE_SPOTLIGHT,
      this.settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
      () => this.overlay.toggle(),
    );
    this.shortcutChangedId = this.settings.connect(`changed::${SettingsKey.TOGGLE_SPOTLIGHT}`, () =>
      this.onShortcutChanged(),
    );
  }

  stop(): void {
    this.settings.disconnect(this.shortcutChangedId);
    Main.wm.removeKeybinding(SettingsKey.TOGGLE_SPOTLIGHT);
    this.overlay.destroy();
    this.apps.destroy();
    this.conflicts.restore();
  }

  /** Atalho trocado nas preferências: devolve o que foi liberado e libera o novo. */
  private onShortcutChanged(): void {
    this.conflicts.restore();
    this.conflicts.release(this.readShortcut());
  }

  private readShortcut(): string[] {
    return this.settings.get_strv(SettingsKey.TOGGLE_SPOTLIGHT);
  }

  private notifyError(error: unknown): void {
    console.error(`[gnome-spotlight] ${describeError(error)}`);
    Main.notifyError(
      this.t("Could not open the result"),
      formatMessage("%s", describeError(error)),
    );
  }
}
