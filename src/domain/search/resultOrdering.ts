/**
 * Ordem única dos resultados: maior relevância primeiro, empate pelo título.
 */
import type { SearchResult } from "@domain/search/searchResult";

export const byRelevance = (left: SearchResult, right: SearchResult): number =>
  right.score - left.score || left.title.localeCompare(right.title);
