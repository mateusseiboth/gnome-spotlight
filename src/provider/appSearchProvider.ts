/**
 * Apps instalados. Nome pesa mais que nome genérico e palavras-chave, que pesam mais que o
 * executável e a descrição. A frequência de uso só desempata (5% da nota).
 */
import type { AppCatalog, AppEntry } from "@domain/apps/appPorts";
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { byRelevance } from "@domain/search/resultOrdering";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { scoreBestField, type WeightedField } from "@domain/text/textMatcher";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const MATCH_SHARE = 0.95;
const USAGE_SHARE = 0.05;

const buildFields = (app: AppEntry): WeightedField[] => [
  { value: app.name, weight: 1 },
  { value: app.genericName, weight: 0.8 },
  ...app.keywords.map((keyword) => ({ value: keyword, weight: 0.8 })),
  { value: app.executable, weight: 0.7 },
  { value: app.description, weight: 0.5 },
];

export class AppSearchProvider extends ModeSearchProvider {
  constructor(private readonly catalog: AppCatalog) {
    super([QueryMode.DEFAULT]);
  }

  async search({ term }: ParsedQuery): Promise<readonly SearchResult[]> {
    return this.catalog
      .list()
      .flatMap((app) => this.toResult(app, scoreBestField(term, buildFields(app))))
      .sort(byRelevance);
  }

  private toResult(app: AppEntry, match: number): SearchResult[] {
    if (match <= 0) return [];

    return [
      {
        id: `app:${app.id}`,
        title: app.name,
        subtitle: app.description,
        kind: ResultKind.APP,
        icon: app.icon,
        score: match * MATCH_SHARE + app.usage * USAGE_SHARE,
        activate: () => this.catalog.launch(app.id),
      },
    ];
  }
}
