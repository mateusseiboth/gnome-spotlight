/**
 * Executa comandos digitados com `>` (no terminal) e `$` (em segundo plano), pelo
 * `Util.trySpawn` do Shell, que herda o ambiente da sessão. Falha vira exceção, tratada
 * pelo presenter (notificação de erro).
 */
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import * as Util from "resource:///org/gnome/shell/misc/util.js";

import type { CommandRunner } from "@domain/launcher/launcherPorts";
import { buildTerminalArgv, resolveTerminal } from "@domain/terminal/terminalResolver";

const TERMINAL_SCHEMA = "org.gnome.desktop.default-applications.terminal";

/** `Util.trySpawn` existe no Shell 50, mas o `@girs/gnome-shell` 50.0.4 não o declara. */
const ShellUtil = Util as unknown as { trySpawn(argv: readonly string[]): void };

export class TerminalNotFoundError extends Error {
  constructor() {
    super("No terminal emulator found.");
    this.name = new.target.name;
  }
}

export class ShellCommandRunner implements CommandRunner {
  private readonly terminalSettings = new Gio.Settings({ schema_id: TERMINAL_SCHEMA });

  runInTerminal(command: string): void {
    const terminal = resolveTerminal(
      {
        exec: this.terminalSettings.get_string("exec"),
        execArg: this.terminalSettings.get_string("exec-arg"),
      },
      (binary) => GLib.find_program_in_path(binary) !== null,
    );
    if (!terminal) throw new TerminalNotFoundError();

    ShellUtil.trySpawn(buildTerminalArgv(terminal, command));
  }

  runInBackground(command: string): void {
    ShellUtil.trySpawn(["sh", "-c", command]);
  }
}
