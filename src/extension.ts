import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { LauncherSession } from "@app/launcherSession";

export default class LauncherExtension extends Extension {
  private session: LauncherSession | null = null;

  override enable(): void {
    this.session = new LauncherSession(this.getSettings(), (message) => this.gettext(message));
    this.session.start();
  }

  override disable(): void {
    this.session?.stop();
    this.session = null;
  }
}
