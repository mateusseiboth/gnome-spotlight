/**
 * Escolha do emulador de terminal para o prefixo `>` e montagem da linha de comando que
 * mantém o shell aberto depois do comando terminar.
 */
import { describe, expect, test } from "bun:test";

import { buildTerminalArgv, resolveTerminal } from "@domain/terminal/terminalResolver";

const availableOnly =
  (...binaries: string[]) =>
  (binary: string): boolean =>
    binaries.includes(binary);

describe("resolveTerminal", () => {
  test("usa o terminal configurado no GNOME quando ele existe", () => {
    const terminal = resolveTerminal(
      { exec: "kitty", execArg: "" },
      availableOnly("kitty", "ptyxis"),
    );

    expect(terminal).toEqual({ executable: "kitty", args: [] });
  });

  test("configurado ausente cai no primeiro conhecido disponível", () => {
    const terminal = resolveTerminal(
      { exec: "xdg-terminal-exec", execArg: "--" },
      availableOnly("gnome-terminal", "xterm"),
    );

    expect(terminal).toEqual({ executable: "gnome-terminal", args: ["--"] });
  });

  test("Ptyxis tem preferência sobre o gnome-terminal", () => {
    const terminal = resolveTerminal(
      { exec: "", execArg: "" },
      availableOnly("gnome-terminal", "ptyxis"),
    );

    expect(terminal?.executable).toBe("ptyxis");
  });

  test("argumento configurado com espaços vira lista", () => {
    const terminal = resolveTerminal(
      { exec: "foo-term", execArg: "--wait -e" },
      availableOnly("foo-term"),
    );

    expect(terminal).toEqual({ executable: "foo-term", args: ["--wait", "-e"] });
  });

  test("nenhum terminal disponível devolve null", () => {
    expect(resolveTerminal({ exec: "", execArg: "" }, availableOnly())).toBeNull();
  });
});

describe("buildTerminalArgv", () => {
  test("roda o comando num shell que continua aberto", () => {
    const argv = buildTerminalArgv({ executable: "ptyxis", args: ["--"] }, "htop -d 5");

    expect(argv).toEqual(["ptyxis", "--", "sh", "-c", 'htop -d 5; exec "${SHELL:-sh}"']);
  });
});
