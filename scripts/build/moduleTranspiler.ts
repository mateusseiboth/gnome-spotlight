import { dirname, posix } from "node:path";

export type SourceAliases = Readonly<Record<string, string>>;

export interface RewrittenModule {
  readonly code: string;
  readonly dependencies: readonly string[];
}

const SOURCE_TARGET = /^\.\/src\/(.*)\*$/;
const ALIAS_IMPORT = /(\bfrom\s*|\bimport\s*)"(@[^"]+)"/g;

export const readSourceAliases = (
  paths: Readonly<Record<string, readonly string[]>>,
): SourceAliases =>
  Object.fromEntries(
    Object.entries(paths).flatMap(([alias, [target = ""]]) => {
      const match = SOURCE_TARGET.exec(target);
      return match ? [[alias.replace(/\*$/, ""), match[1] ?? ""]] : [];
    }),
  );

export const toRelativeImport = (fromModule: string, toModule: string): string => {
  const path = posix.relative(dirname(fromModule), toModule);
  return `${path.startsWith(".") ? path : `./${path}`}.js`;
};

const resolveAlias = (specifier: string, aliases: SourceAliases): string => {
  const alias = Object.keys(aliases).find((prefix) => specifier.startsWith(prefix));
  if (alias === undefined) throw new Error(`Alias sem destino em src: ${specifier}`);

  return `${aliases[alias]}${specifier.slice(alias.length)}`;
};

export const rewriteAliasImports = (
  code: string,
  fromModule: string,
  aliases: SourceAliases,
): RewrittenModule => {
  const dependencies: string[] = [];
  const rewritten = code.replace(ALIAS_IMPORT, (_, keyword: string, specifier: string) => {
    const target = resolveAlias(specifier, aliases);
    dependencies.push(target);
    return `${keyword}"${toRelativeImport(fromModule, target)}"`;
  });

  return { code: rewritten, dependencies };
};
