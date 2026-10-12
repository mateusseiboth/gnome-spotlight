import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

/**
 * Monta a extensão em `dist/` no formato que o GNOME Shell carrega:
 *
 *   extension.js, prefs.js   bundle ESM (aliases resolvidos; `gi://` e `resource://` externos)
 *   stylesheet*.css          gerados pelo `buildStylesheet` (claro, escuro e fallback)
 *   metadata.json, schemas/  copiados; o schema é compilado aqui
 *   locale/<lang>/...mo      compilados a partir de `po/*.po`
 */
import { $ } from "bun";

import { buildStylesheet, ThemeVariant } from "@style/stylesheet";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const DOMAIN = "gnome-spotlight";

/** O bundle não pode embutir o que só existe dentro do GJS/Shell. */
const RUNTIME_EXTERNALS = ["gi://*", "resource://*"];

const bundle = async (): Promise<void> => {
  const result = await Bun.build({
    entrypoints: [join(ROOT, "src/extension.ts"), join(ROOT, "src/prefs.ts")],
    outdir: DIST,
    format: "esm",
    target: "browser",
    external: RUNTIME_EXTERNALS,
    minify: false,
    splitting: false,
  });

  if (!result.success) {
    result.logs.forEach((log) => console.error(log));
    throw new Error("Falha no bundle.");
  }
};

const writeStylesheets = (): void => {
  writeFileSync(join(DIST, "stylesheet-dark.css"), buildStylesheet(ThemeVariant.DARK));
  writeFileSync(join(DIST, "stylesheet-light.css"), buildStylesheet(ThemeVariant.LIGHT));
  writeFileSync(join(DIST, "stylesheet.css"), buildStylesheet(ThemeVariant.DARK));
};

const copyStatic = async (): Promise<void> => {
  cpSync(join(ROOT, "metadata.json"), join(DIST, "metadata.json"));
  cpSync(join(ROOT, "schemas"), join(DIST, "schemas"), { recursive: true });
  await $`glib-compile-schemas --strict ${join(DIST, "schemas")}`;
};

const compileTranslations = async (): Promise<void> => {
  const catalogs = readdirSync(join(ROOT, "po")).filter((name) => name.endsWith(".po"));

  for (const catalog of catalogs) {
    const language = basename(catalog, ".po");
    const target = join(DIST, "locale", language, "LC_MESSAGES");
    mkdirSync(target, { recursive: true });
    await $`msgfmt --check -o ${join(target, `${DOMAIN}.mo`)} ${join(ROOT, "po", catalog)}`;
  }
};

rmSync(DIST, { recursive: true, force: true });
await bundle();
writeStylesheets();
await copyStatic();
await compileTranslations();
console.log(`Extensão montada em ${DIST}`);
