/**
 * Escolhe o emulador de terminal do prefixo `>`.
 *
 * Primeiro o configurado no GNOME (`org.gnome.desktop.default-applications.terminal`).
 * Ele pode apontar para um binário que não existe: no Fedora 44 o padrão é
 * `xdg-terminal-exec`, que não vem instalado. Nesse caso cai na lista de conhecidos,
 * cada um com o argumento que separa as opções dele do comando a executar.
 */

export interface ConfiguredTerminal {
  readonly exec: string;
  readonly execArg: string;
}

export interface Terminal {
  readonly executable: string;
  readonly args: readonly string[];
}

export type BinaryAvailability = (binary: string) => boolean;

/** Ordem = preferência. Argumentos conferidos no `--help` de cada emulador. */
const KNOWN_TERMINALS: readonly Terminal[] = [
  { executable: "xdg-terminal-exec", args: [] },
  { executable: "ptyxis", args: ["--"] },
  { executable: "kgx", args: ["--"] },
  { executable: "gnome-terminal", args: ["--"] },
  { executable: "konsole", args: ["-e"] },
  { executable: "kitty", args: [] },
  { executable: "alacritty", args: ["-e"] },
  { executable: "foot", args: [] },
  { executable: "wezterm", args: ["start", "--"] },
  { executable: "xterm", args: ["-e"] },
];

const splitArgs = (execArg: string): string[] => execArg.split(/\s+/).filter(Boolean);

export const resolveTerminal = (
  configured: ConfiguredTerminal,
  isAvailable: BinaryAvailability,
): Terminal | null => {
  if (configured.exec && isAvailable(configured.exec)) {
    return { executable: configured.exec, args: splitArgs(configured.execArg) };
  }

  return KNOWN_TERMINALS.find((terminal) => isAvailable(terminal.executable)) ?? null;
};

/** O shell interativo no fim mantém a janela aberta para o usuário ler a saída. */
export const buildTerminalArgv = (terminal: Terminal, command: string): string[] => [
  terminal.executable,
  ...terminal.args,
  "sh",
  "-c",
  `${command}; exec "\${SHELL:-sh}"`,
];
