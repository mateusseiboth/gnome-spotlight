/**
 * Janelas normais abertas em todas as áreas de trabalho, com o app dono via
 * `Shell.WindowTracker`.
 */
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import type { WindowCatalog, WindowEntry } from "@domain/windows/windowPorts";

const SEARCHABLE_TYPES: ReadonlySet<Meta.WindowType> = new Set([
  Meta.WindowType.NORMAL,
  Meta.WindowType.DIALOG,
]);

const isSearchable = (window: Meta.Window): boolean =>
  !window.is_skip_taskbar() && SEARCHABLE_TYPES.has(window.get_window_type());

export class ShellWindowCatalog implements WindowCatalog {
  private readonly tracker = Shell.WindowTracker.get_default();

  list(): readonly WindowEntry[] {
    return this.listWindows().map((window) => this.toEntry(window));
  }

  focus(id: string): void {
    const window = this.listWindows().find((candidate) => String(candidate.get_id()) === id);
    if (window) Main.activateWindow(window);
  }

  private listWindows(): Meta.Window[] {
    return global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null).filter(isSearchable);
  }

  private toEntry(window: Meta.Window): WindowEntry {
    const app = this.tracker.get_window_app(window);
    const appName = app?.get_name() ?? "";
    const gicon = app?.get_icon();

    return {
      id: String(window.get_id()),
      title: window.get_title() ?? appName,
      appName,
      icon: gicon ? { gicon } : { name: "focus-windows-symbolic" },
    };
  }
}
