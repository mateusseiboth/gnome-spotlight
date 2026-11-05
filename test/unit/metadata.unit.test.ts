import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

interface Metadata {
  readonly uuid: string;
  readonly name: string;
  readonly description: string;
  readonly "shell-version": readonly string[];
  readonly "settings-schema": string;
  readonly "gettext-domain": string;
  readonly version?: number;
}

const metadata = JSON.parse(readFileSync(join(ROOT, "metadata.json"), "utf8")) as Metadata;
const schemaXml = readFileSync(
  join(ROOT, "schemas", `${metadata["settings-schema"]}.gschema.xml`),
  "utf8",
);

describe("metadata.json", () => {
  test("identifica a extensão como Launchpad Search", () => {
    expect(metadata.uuid).toBe("launchpad-search@mateusseiboth.github.io");
    expect(metadata.name).toBe("Launchpad Search");
  });

  test("schema e domínio de tradução batem com o XML", () => {
    expect(schemaXml).toContain(`<schema id="${metadata["settings-schema"]}"`);
    expect(schemaXml).toContain(`gettext-domain="${metadata["gettext-domain"]}"`);
  });

  test("declara o uso da área de transferência", () => {
    expect(metadata.description).toContain("clipboard");
  });

  test("não cita produto de terceiros", () => {
    expect(`${metadata.name} ${metadata.description}`).not.toMatch(/spotlight|macos|cosmic/i);
  });

  test("deixa a versão para o extensions.gnome.org", () => {
    expect(metadata.version).toBeUndefined();
  });
});
