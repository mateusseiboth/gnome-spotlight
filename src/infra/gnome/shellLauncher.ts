/**
 * Abre URLs e caminhos no aplicativo padrão, com o contexto de lançamento do Shell
 * (notificação de início e área de trabalho certa).
 */
import Gio from "gi://Gio";

import type { UriLauncher } from "@domain/launcher/launcherPorts";

export class ShellLauncher implements UriLauncher {
  openUri(uri: string): void {
    Gio.AppInfo.launch_default_for_uri(uri, global.create_app_launch_context(0, -1));
  }

  openPath(path: string): void {
    this.openUri(Gio.File.new_for_path(path).get_uri());
  }
}
