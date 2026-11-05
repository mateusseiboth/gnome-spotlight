import { describe, expect, test } from "bun:test";

import {
  readSourceAliases,
  rewriteAliasImports,
  toRelativeImport,
} from "@scripts/build/moduleTranspiler";

describe("readSourceAliases", () => {
  test("usa só os aliases que apontam para src", () => {
    const aliases = readSourceAliases({
      "@domain/*": ["./src/domain/*"],
      "@infra/*": ["./src/infra/*"],
      "@test/*": ["./test/*"],
    });

    expect(aliases).toEqual({ "@domain/": "domain/", "@infra/": "infra/" });
  });
});

describe("toRelativeImport", () => {
  test.each([
    ["extension", "app/launcherSession", "./app/launcherSession.js"],
    ["app/launcherSession", "ui/launcherOverlay", "../ui/launcherOverlay.js"],
    ["ui/launcherOverlay", "ui/resultRow", "./resultRow.js"],
    ["infra/gnome/shellLauncher", "domain/files/pathQuery", "../../domain/files/pathQuery.js"],
  ])("de %p para %p", (from, to, expected) => {
    expect(toRelativeImport(from, to)).toBe(expected);
  });
});

describe("rewriteAliasImports", () => {
  const aliases = { "@domain/": "domain/", "@ui/": "ui/" };

  test("troca alias por caminho relativo e lista as dependências", () => {
    const code = [
      'import { parseQuery } from "@domain/query/queryParser";',
      'import * as Main from "resource:///org/gnome/shell/ui/main.js";',
      'import St from "gi://St";',
      'export { ResultRow } from "@ui/resultRow";',
    ].join("\n");

    const result = rewriteAliasImports(code, "ui/launcherOverlay", aliases);

    expect(result.code).toBe(
      [
        'import { parseQuery } from "../domain/query/queryParser.js";',
        'import * as Main from "resource:///org/gnome/shell/ui/main.js";',
        'import St from "gi://St";',
        'export { ResultRow } from "./resultRow.js";',
      ].join("\n"),
    );
    expect(result.dependencies).toEqual(["domain/query/queryParser", "ui/resultRow"]);
  });

  test("alias desconhecido interrompe o build", () => {
    expect(() => rewriteAliasImports('import x from "@nada/x";', "extension", aliases)).toThrow(
      "@nada/x",
    );
  });
});
