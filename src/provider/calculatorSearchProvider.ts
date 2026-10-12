/**
 * Contas. No modo padrão só aparece quando o texto parece conta; com `=` aceita qualquer
 * expressão válida. Enter copia o resultado.
 */
import {
  detectDecimalSeparator,
  evaluateExpression,
  formatCalculatorNumber,
  isMathExpression,
} from "@domain/calculator/calculator";
import type { Clipboard } from "@domain/launcher/launcherPorts";
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import type { Translate } from "@i18n/translate";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const CALCULATOR_SCORE = 0.97;

const EXPRESSION_GUARDS: Partial<Record<QueryMode, (term: string) => boolean>> = {
  [QueryMode.DEFAULT]: isMathExpression,
  [QueryMode.CALCULATOR]: () => true,
};

export class CalculatorSearchProvider extends ModeSearchProvider {
  constructor(
    private readonly clipboard: Clipboard,
    private readonly t: Translate,
  ) {
    super([QueryMode.DEFAULT, QueryMode.CALCULATOR]);
  }

  async search({ mode, term }: ParsedQuery): Promise<readonly SearchResult[]> {
    if (!EXPRESSION_GUARDS[mode]?.(term)) return [];

    const result = evaluateExpression(term);
    if (!result.ok) return [];

    const formatted = formatCalculatorNumber(result.value, detectDecimalSeparator(term));
    return [
      {
        id: "calculator:result",
        title: formatted,
        subtitle: this.t("Press Enter to copy the result"),
        kind: ResultKind.CALCULATOR,
        icon: { name: "accessories-calculator-symbolic" },
        score: CALCULATOR_SCORE,
        activate: () => this.clipboard.setText(formatted),
      },
    ];
  }
}
