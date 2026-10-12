/**
 * Orquestra uma busca: lê o modo, consulta em paralelo os provedores daquele modo, junta,
 * remove repetidos, ordena por relevância e corta no limite configurado.
 *
 * Provedor que falha é registrado e ignorado: uma pasta ilegível não pode esconder os apps.
 */
import { parseQuery } from "@domain/query/queryParser";
import { byRelevance } from "@domain/search/resultOrdering";
import type { SearchProvider } from "@domain/search/searchProvider";
import type { SearchResult } from "@domain/search/searchResult";

export type ResultLimit = () => number;
export type ProviderErrorListener = (error: unknown) => void;

const keepBestPerId = (results: readonly SearchResult[]): SearchResult[] => {
  const best = new Map<string, SearchResult>();

  for (const result of results) {
    const existing = best.get(result.id);
    if (existing && existing.score >= result.score) continue;
    best.set(result.id, result);
  }

  return [...best.values()];
};

export class SearchService {
  constructor(
    private readonly providers: readonly SearchProvider[],
    private readonly limit: ResultLimit,
    private readonly onProviderError: ProviderErrorListener = () => {},
  ) {}

  async search(raw: string): Promise<SearchResult[]> {
    const query = parseQuery(raw);
    if (!query.term) return [];

    const active = this.providers.filter((provider) => provider.answers(query.mode));
    const settled = await Promise.allSettled(active.map((provider) => provider.search(query)));

    return keepBestPerId(settled.flatMap((outcome) => this.unwrap(outcome)))
      .sort(byRelevance)
      .slice(0, this.limit());
  }

  private unwrap(outcome: PromiseSettledResult<readonly SearchResult[]>): readonly SearchResult[] {
    if (outcome.status === "fulfilled") return outcome.value;

    this.onProviderError(outcome.reason);
    return [];
  }
}
