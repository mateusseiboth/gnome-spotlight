/**
 * Linha "Atalho" das preferências: mostra o atalho atual e, ao clicar em "Alterar",
 * abre um diálogo que captura a próxima combinação. As regras do que vale estão em
 * `classifyShortcutPress` (domínio, testado).
 *
 * Durante a captura a janela pede `inhibit_system_shortcuts`: sem isso o Shell consome
 * o próprio Super+Espaço (e qualquer atalho global) antes de a janela vê-lo.
 */
import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import type Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import {
  classifyShortcutPress,
  ShortcutCapture,
  type ShortcutPress,
} from "@domain/keybinding/shortcutCapture";

type CaptureHandler = (dialog: Adw.AlertDialog, accelerator: string) => void;

const toShortcutPress = (keyval: number, mask: Gdk.ModifierType): ShortcutPress => ({
  keyName: Gdk.keyval_name(keyval) ?? "",
  hasSuper: (mask & Gdk.ModifierType.SUPER_MASK) !== 0,
  hasControl: (mask & Gdk.ModifierType.CONTROL_MASK) !== 0,
  hasAlt: (mask & Gdk.ModifierType.ALT_MASK) !== 0,
  hasShift: (mask & Gdk.ModifierType.SHIFT_MASK) !== 0,
});

export class ShortcutRow {
  readonly row: Adw.ActionRow;
  private readonly label: Gtk.ShortcutLabel;

  constructor(
    private readonly settings: Gio.Settings,
    private readonly key: string,
  ) {
    this.label = new Gtk.ShortcutLabel({ disabled_text: _("Disabled"), valign: Gtk.Align.CENTER });
    const button = new Gtk.Button({ label: _("Change"), valign: Gtk.Align.CENTER });

    this.row = new Adw.ActionRow({ title: _("Shortcut"), activatable_widget: button });
    this.row.add_suffix(this.label);
    this.row.add_suffix(button);

    button.connect("clicked", () => this.openCaptureDialog());
    settings.connect(`changed::${key}`, () => this.syncLabel());
    this.syncLabel();
  }

  private syncLabel(): void {
    this.label.set_accelerator(this.settings.get_strv(this.key)[0] ?? "");
  }

  private openCaptureDialog(): void {
    const dialog = new Adw.AlertDialog({
      heading: _("Press the new shortcut"),
      body: _("Esc cancels. Backspace disables the shortcut."),
    });
    dialog.add_response("cancel", _("Cancel"));

    const controller = new Gtk.EventControllerKey();
    controller.connect(
      "key-pressed",
      (_controller, keyval: number, _keycode: number, state: Gdk.ModifierType) =>
        this.onKeyPressed(dialog, keyval, state),
    );
    dialog.add_controller(controller);

    dialog.connect("map", () => this.toplevelOf(dialog)?.inhibit_system_shortcuts(null));
    dialog.connect("closed", () => this.toplevelOf(dialog)?.restore_system_shortcuts());
    dialog.present(this.row);
  }

  private onKeyPressed(dialog: Adw.AlertDialog, keyval: number, state: Gdk.ModifierType): boolean {
    const mask = state & Gtk.accelerator_get_default_mod_mask();
    const lowerKeyval = Gdk.keyval_to_lower(keyval);
    const capture = classifyShortcutPress(toShortcutPress(lowerKeyval, mask));

    this.captureHandlers[capture](dialog, Gtk.accelerator_name(lowerKeyval, mask) ?? "");
    return Gdk.EVENT_STOP;
  }

  /** O que cada desfecho da captura faz (strategy map). */
  private readonly captureHandlers: Record<ShortcutCapture, CaptureHandler> = {
    [ShortcutCapture.CANCEL]: (dialog) => dialog.close(),
    [ShortcutCapture.CLEAR]: (dialog) => this.save(dialog, []),
    [ShortcutCapture.INCOMPLETE]: () => {},
    [ShortcutCapture.INVALID]: (dialog) =>
      dialog.set_body(_("Use Super, Ctrl or Alt together with another key.")),
    [ShortcutCapture.ACCEPT]: (dialog, accelerator) => this.save(dialog, [accelerator]),
  };

  private save(dialog: Adw.AlertDialog, accelerators: string[]): void {
    this.settings.set_strv(this.key, accelerators);
    dialog.close();
  }

  private toplevelOf(widget: Gtk.Widget): Gdk.Toplevel | null {
    const surface = widget.get_native()?.get_surface();
    return surface instanceof Gdk.Toplevel ? surface : null;
  }
}
