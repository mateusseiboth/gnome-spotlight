import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SettingsKey } from "@infra/gnome/settingsKeys";

const SCHEMA_ID = "org.gnome.shell.extensions.launchpad-search";

const SCHEMA = readFileSync(
  join(import.meta.dir, "..", "..", "schemas", `${SCHEMA_ID}.gschema.xml`),
  "utf8",
);

const keyBlockOf = (key: string): string =>
  SCHEMA.match(new RegExp(`<key name="${key}"[\\s\\S]*?</key>`))?.[0] ?? "";

const schemaKeys = (): string[] =>
  [...SCHEMA.matchAll(/<key name="([^"]+)"/g)].map((match) => match[1] ?? "");

describe("schema GSettings", () => {
  test("usa o id e o caminho da extensão", () => {
    expect(SCHEMA).toContain(
      `<schema id="${SCHEMA_ID}" path="/org/gnome/shell/extensions/launchpad-search/">`,
    );
  });

  test("tem exatamente as chaves do código", () => {
    expect(schemaKeys().sort()).toEqual([...Object.values(SettingsKey)].sort());
  });

  test("o atalho padrão é Super+Alt+Espaço", () => {
    expect(keyBlockOf(SettingsKey.TOGGLE_LAUNCHER)).toContain(
      "<default><![CDATA[['<Super><Alt>space']]]></default>",
    );
  });
});
