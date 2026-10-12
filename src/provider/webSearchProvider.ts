/**
 * Busca na web: com `?` é o resultado principal; no modo padrão entra como último recurso.
 */
import type { SearchSettings, UriLauncher } from "@domain/launcher/launcherPorts";
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { formatMessage, type Translate } from "@i18n/translate";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const SCORE_BY_MODE: Partial<Record<QueryMode, number>> = {
  [QueryMode.WEB]: 1,
  [QueryMode.DEFAULT]: 0.01,
};

export class WebSearchProvider extends ModeSearchProvider {
  constructor(
    private readonly launcher: UriLauncher,
    private readonly settings: SearchSettings,
    private readonly t: Translate,
  ) {
    super([QueryMode.WEB, QueryMode.DEFAULT]);
  }

  async search({ mode, term }: ParsedQuery): Promise<readonly SearchResult[]> {
    if (!term) return [];

    return [
      {
        id: "web:search",
        title: formatMessage(this.t("Search the web for “%s”"), term),
        kind: ResultKind.WEB,
        icon: { name: "web-browser-symbolic" },
        score: SCORE_BY_MODE[mode] ?? 0,
        activate: () => this.launcher.openUri(this.buildUrl(term)),
      },
    ];
  }

  private buildUrl(term: string): string {
    return this.settings.searchUrl().replace("%s", encodeURIComponent(term));
  }
}
