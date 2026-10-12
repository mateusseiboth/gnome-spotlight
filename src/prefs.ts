/**
 * Preferências (processo separado, GTK 4 + libadwaita): atalho configurável, limite de
 * resultados, URL da busca na web e a cola dos prefixos.
 */
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { SettingsKey } from "@infra/gnome/settingsKeys";
import { ShortcutRow } from "@prefs/shortcutRow";

interface PrefixHelp {
  readonly prefix: string;
  readonly description: () => string;
}

const PREFIXES: readonly PrefixHelp[] = [
  { prefix: "=", description: () => _("Calculate") },
  { prefix: ">", description: () => _("Run in terminal") },
  { prefix: "$", description: () => _("Run in background") },
  { prefix: "/  ~", description: () => _("Browse files and folders") },
  { prefix: "?", description: () => _("Search the web") },
];

export default class GnomeSpotlightPreferences extends ExtensionPreferences {
  override async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();

    page.add(this.buildSearchGroup(settings));
    page.add(this.buildPrefixGroup());
    window.add(page);
  }

  private buildSearchGroup(settings: Gio.Settings): Adw.PreferencesGroup {
    const group = new Adw.PreferencesGroup({ title: _("Search") });

    group.add(new ShortcutRow(settings, SettingsKey.TOGGLE_SPOTLIGHT).row);

    const maxResults = new Adw.SpinRow({
      title: _("Maximum results"),
      adjustment: new Gtk.Adjustment({ lower: 3, upper: 20, step_increment: 1 }),
    });
    settings.bind(SettingsKey.MAX_RESULTS, maxResults, "value", Gio.SettingsBindFlags.DEFAULT);
    group.add(maxResults);

    const searchUrl = new Adw.EntryRow({
      title: _("Web search address (%s is the searched text)"),
    });
    settings.bind(SettingsKey.WEB_SEARCH_URL, searchUrl, "text", Gio.SettingsBindFlags.DEFAULT);
    group.add(searchUrl);

    return group;
  }

  private buildPrefixGroup(): Adw.PreferencesGroup {
    const group = new Adw.PreferencesGroup({ title: _("Prefixes") });

    for (const { prefix, description } of PREFIXES) {
      group.add(new Adw.ActionRow({ title: prefix, subtitle: description() }));
    }

    return group;
  }
}
