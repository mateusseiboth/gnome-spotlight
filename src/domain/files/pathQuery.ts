/**
 * Caminho digitado na busca de arquivos, separado em pasta a listar + trecho do nome.
 */

export interface PathQuery {
  readonly directory: string;
  readonly partial: string;
}

const expandHome = (path: string, home: string): string => {
  if (path === "~") return `${home}/`;
  if (path.startsWith("~/")) return `${home}${path.slice(1)}`;
  return path;
};

const withoutTrailingSlash = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, "") : path;

export const parsePathQuery = (term: string, home: string): PathQuery => {
  const expanded = expandHome(term, home);
  const lastSlash = expanded.lastIndexOf("/");
  const directory = expanded.slice(0, lastSlash + 1) || "/";

  return { directory: withoutTrailingSlash(directory), partial: expanded.slice(lastSlash + 1) };
};

export const joinPath = (directory: string, name: string): string =>
  directory === "/" ? `/${name}` : `${directory}/${name}`;

export const abbreviateHome = (path: string, home: string): string => {
  if (path === home) return "~";
  if (path.startsWith(`${home}/`)) return `~${path.slice(home.length)}`;
  return path;
};
