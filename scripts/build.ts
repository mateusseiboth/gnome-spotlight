import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { $ } from "bun";

import { readSourceAliases, rewriteAliasImports } from "@scripts/build/moduleTranspiler";
import { buildStylesheet, ThemeVariant } from "@style/stylesheet";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const ENTRY_MODULES = ["extension", "prefs"];

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

const { "gettext-domain": DOMAIN } = readJson<{ "gettext-domain": string }>(
  join(ROOT, "metadata.json"),
);
const ALIASES = readSourceAliases(
  readJson<{ compilerOptions: { paths: Record<string, string[]> } }>(
    join(ROOT, "tsconfig.base.json"),
  ).compilerOptions.paths,
);

const transpiler = new Bun.Transpiler({ loader: "ts", target: "browser" });

const transpileModule = (module: string): readonly string[] => {
  const source = readFileSync(join(SRC, `${module}.ts`), "utf8");
  const { code, dependencies } = rewriteAliasImports(
    transpiler.transformSync(source),
    module,
    ALIASES,
  );
  const target = join(DIST, `${module}.js`);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, code);
  return dependencies;
};

const transpileReachableModules = (): string[] => {
  const modules = [...ENTRY_MODULES];

  for (const module of modules) {
    const fresh = transpileModule(module).filter((dependency) => !modules.includes(dependency));
    modules.push(...new Set(fresh));
  }

  return modules.map((module) => join(DIST, `${module}.js`));
};

const formatModules = async (files: readonly string[]): Promise<void> => {
  await $`${join(ROOT, "node_modules/.bin/oxfmt")} ${files}`.cwd(ROOT).quiet();
};

const writeStylesheets = (): void => {
  writeFileSync(join(DIST, "stylesheet-dark.css"), buildStylesheet(ThemeVariant.DARK));
  writeFileSync(join(DIST, "stylesheet-light.css"), buildStylesheet(ThemeVariant.LIGHT));
  writeFileSync(join(DIST, "stylesheet.css"), buildStylesheet(ThemeVariant.DARK));
};

const copyStatic = async (): Promise<void> => {
  cpSync(join(ROOT, "metadata.json"), join(DIST, "metadata.json"));
  cpSync(join(ROOT, "LICENSE"), join(DIST, "LICENSE"));
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
await formatModules(transpileReachableModules());
writeStylesheets();
await copyStatic();
await compileTranslations();
console.log(`Extensão montada em ${DIST}`);
