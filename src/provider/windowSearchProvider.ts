/**
 * Janelas abertas, pelo título ou pelo nome do app. Pesam um pouco menos que o app de
 * mesmo nome: digitar "firefox" abre o app primeiro e a janela logo abaixo.
 */
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { byRelevance } from "@domain/search/resultOrdering";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { scoreBestField } from "@domain/text/textMatcher";
import type { WindowCatalog, WindowEntry } from "@domain/windows/windowPorts";
import { formatMessage, type Translate } from "@i18n/translate";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const MATCH_SHARE = 0.95;

export class WindowSearchProvider extends ModeSearchProvider {
  constructor(
    private readonly catalog: WindowCatalog,
    private readonly t: Translate,
  ) {
    super([QueryMode.DEFAULT]);
  }

  async search({ term }: ParsedQuery): Promise<readonly SearchResult[]> {
    return this.catalog
      .list()
      .flatMap((window) => this.toResult(window, term))
      .sort(byRelevance);
  }

  private toResult(window: WindowEntry, term: string): SearchResult[] {
    const match = scoreBestField(term, [
      { value: window.title, weight: 0.9 },
      { value: window.appName, weight: 0.85 },
    ]);
    if (match <= 0) return [];

    return [
      {
        id: `window:${window.id}`,
        title: window.title,
        subtitle: formatMessage(this.t("Switch to %s"), window.appName),
        kind: ResultKind.WINDOW,
        icon: window.icon,
        score: match * MATCH_SHARE,
        activate: () => this.catalog.focus(window.id),
      },
    ];
  }
}
