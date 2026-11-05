export interface ConfiguredTerminal {
  readonly exec: string;
  readonly execArg: string;
}

export interface Terminal {
  readonly executable: string;
  readonly args: readonly string[];
}

export type BinaryAvailability = (binary: string) => boolean;

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

export const buildTerminalArgv = (terminal: Terminal, command: string): string[] => [
  terminal.executable,
  ...terminal.args,
  "sh",
  "-c",
  `${command}; exec "\${SHELL:-sh}"`,
];
