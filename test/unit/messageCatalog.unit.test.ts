/**
 * Toda mensagem marcada para tradução no código tem tradução pt-BR, e o catálogo não
 * carrega mensagem que o código não usa mais.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extractMessagesFromSources, parsePoFile } from "@scripts/i18n/messageCatalog";

const ROOT = join(import.meta.dir, "..", "..");

describe("catálogo pt_BR", () => {
  const sourceMessages = extractMessagesFromSources(join(ROOT, "src"));
  const catalog = parsePoFile(readFileSync(join(ROOT, "po", "pt_BR.po"), "utf8"));

  test("o código tem mensagens marcadas", () => {
    expect(sourceMessages.size).toBeGreaterThan(0);
  });

  test("toda mensagem do código está traduzida", () => {
    const missing = [...sourceMessages].filter((message) => !catalog.get(message));

    expect(missing).toEqual([]);
  });

  test("o catálogo não tem mensagem órfã", () => {
    const orphans = [...catalog.keys()].filter((message) => !sourceMessages.has(message));

    expect(orphans).toEqual([]);
  });

  test("tradução não leva travessão", () => {
    const withDash = [...catalog.values()].filter((translation) => translation.includes("—"));

    expect(withDash).toEqual([]);
  });
});

describe("parsePoFile", () => {
  test("lê msgid e msgstr com escapes e linhas continuadas", () => {
    const po = [
      'msgid ""',
      'msgstr "Content-Type: text/plain; charset=UTF-8\\n"',
      "",
      'msgid "Search the web for “%s”"',
      'msgstr "Pesquisar “%s” na web"',
      "",
      'msgid ""',
      '"Two "',
      '"lines"',
      'msgstr "Duas \\"linhas\\""',
    ].join("\n");

    const catalog = parsePoFile(po);

    expect(catalog.get("Search the web for “%s”")).toBe("Pesquisar “%s” na web");
    expect(catalog.get("Two lines")).toBe('Duas "linhas"');
    expect(catalog.has("")).toBe(false);
  });
});
