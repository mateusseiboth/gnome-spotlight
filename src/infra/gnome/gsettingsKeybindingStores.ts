/**
 * Leitura e escrita de atalhos do GNOME e do registro do que a extensão liberou.
 */
import Gio from "gi://Gio";

import type {
  KeybindingLocation,
  KeybindingStore,
  ReleasedBindingStore,
} from "@domain/keybinding/keybindingPorts";
import { SettingsKey } from "@infra/gnome/settingsKeys";

export class GSettingsKeybindingStore implements KeybindingStore {
  private readonly bySchema = new Map<string, Gio.Settings>();

  read({ schema, key }: KeybindingLocation): string[] {
    return this.settingsFor(schema).get_strv(key);
  }

  write({ schema, key }: KeybindingLocation, accelerators: readonly string[]): void {
    this.settingsFor(schema).set_strv(key, [...accelerators]);
  }

  private settingsFor(schema: string): Gio.Settings {
    const cached = this.bySchema.get(schema);
    if (cached) return cached;

    const settings = new Gio.Settings({ schema_id: schema });
    this.bySchema.set(schema, settings);
    return settings;
  }
}

export class GSettingsReleasedBindingStore implements ReleasedBindingStore {
  constructor(private readonly settings: Gio.Settings) {}

  read(): string {
    return this.settings.get_string(SettingsKey.RELEASED_KEYBINDINGS);
  }

  write(value: string): void {
    this.settings.set_string(SettingsKey.RELEASED_KEYBINDINGS, value);
  }
}
