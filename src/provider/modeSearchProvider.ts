/**
 * Base dos provedores: guarda os modos atendidos e responde `answers`.
 */
import type { ParsedQuery, QueryMode } from "@domain/query/queryParser";
import type { SearchProvider } from "@domain/search/searchProvider";
import type { SearchResult } from "@domain/search/searchResult";

export abstract class ModeSearchProvider implements SearchProvider {
  protected constructor(private readonly modes: readonly QueryMode[]) {}

  answers(mode: QueryMode): boolean {
    return this.modes.includes(mode);
  }

  abstract search(query: ParsedQuery): Promise<readonly SearchResult[]>;
}
