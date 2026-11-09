import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { extractMessagesFromSources, parsePoFile } from "@scripts/i18n/messageCatalog";

const ROOT = join(import.meta.dir, "..", "..");
const PO_DIR = join(ROOT, "po");
const LANGUAGES = readdirSync(PO_DIR)
  .filter((name) => name.endsWith(".po"))
  .map((name) => basename(name, ".po"))
  .sort();

const sourceMessages = extractMessagesFromSources(join(ROOT, "src"));
const readCatalog = (language: string) =>
  parsePoFile(readFileSync(join(PO_DIR, `${language}.po`), "utf8"));

describe("catálogos de tradução", () => {
  test("o código tem mensagens marcadas", () => {
    expect(sourceMessages.size).toBeGreaterThan(0);
  });

  test("o alemão vale para todo locale alemão", () => {
    expect(LANGUAGES).toEqual(["de", "pt_BR"]);
  });

  test.each(LANGUAGES)("%s traduz toda mensagem do código", (language) => {
    const catalog = readCatalog(language);
    const missing = [...sourceMessages].filter((message) => !catalog.get(message));

    expect(missing).toEqual([]);
  });

  test.each(LANGUAGES)("%s não tem mensagem órfã", (language) => {
    const orphans = [...readCatalog(language).keys()].filter(
      (message) => !sourceMessages.has(message),
    );

    expect(orphans).toEqual([]);
  });

  test.each(LANGUAGES)("%s não leva travessão", (language) => {
    const withDash = [...readCatalog(language).values()].filter((translation) =>
      translation.includes("—"),
    );

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
