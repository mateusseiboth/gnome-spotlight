import type { ParsedQuery, QueryMode } from "@domain/query/queryParser";
import type { SearchResult } from "@domain/search/searchResult";

export interface SearchProvider {
  answers(mode: QueryMode): boolean;
  search(query: ParsedQuery): Promise<readonly SearchResult[]>;
}
