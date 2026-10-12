/**
 * Ações do sistema (bloquear, suspender, desligar...). Quem casa as palavras-chave
 * traduzidas é o próprio Shell; aqui só se pontua pelo nome, com nota mínima garantida.
 */
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import type { SystemActionCatalog, SystemActionEntry } from "@domain/system/systemActionPorts";
import { scoreMatch } from "@domain/text/textMatcher";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const NAME_SHARE = 0.9;
const KEYWORD_ONLY_SCORE = 0.5;

export class SystemActionSearchProvider extends ModeSearchProvider {
  constructor(private readonly catalog: SystemActionCatalog) {
    super([QueryMode.DEFAULT]);
  }

  async search({ term }: ParsedQuery): Promise<readonly SearchResult[]> {
    return this.catalog.findMatching(term).map((action) => this.toResult(action, term));
  }

  private toResult(action: SystemActionEntry, term: string): SearchResult {
    return {
      id: `system:${action.id}`,
      title: action.name,
      kind: ResultKind.SYSTEM,
      icon: { name: action.iconName },
      score: Math.max(scoreMatch(term, action.name) * NAME_SHARE, KEYWORD_ONLY_SCORE),
      activate: () => this.catalog.activate(action.id),
    };
  }
}
