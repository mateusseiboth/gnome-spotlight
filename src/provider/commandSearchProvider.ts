/**
 * Comandos: `>` abre no terminal (para ver a saída), `$` roda em segundo plano.
 */
import type { CommandRunner } from "@domain/launcher/launcherPorts";
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import type { Translate } from "@i18n/translate";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

interface CommandStrategy {
  readonly subtitle: (t: Translate) => string;
  readonly iconName: string;
  readonly run: (runner: CommandRunner, command: string) => void;
}

const COMMAND_STRATEGIES: Partial<Record<QueryMode, CommandStrategy>> = {
  [QueryMode.TERMINAL_COMMAND]: {
    subtitle: (t) => t("Run in terminal"),
    iconName: "utilities-terminal-symbolic",
    run: (runner, command) => runner.runInTerminal(command),
  },
  [QueryMode.BACKGROUND_COMMAND]: {
    subtitle: (t) => t("Run in background"),
    iconName: "system-run-symbolic",
    run: (runner, command) => runner.runInBackground(command),
  },
};

export class CommandSearchProvider extends ModeSearchProvider {
  constructor(
    private readonly runner: CommandRunner,
    private readonly t: Translate,
  ) {
    super([QueryMode.TERMINAL_COMMAND, QueryMode.BACKGROUND_COMMAND]);
  }

  async search({ mode, term }: ParsedQuery): Promise<readonly SearchResult[]> {
    const strategy = COMMAND_STRATEGIES[mode];
    if (!strategy || !term) return [];

    return [
      {
        id: `command:${mode}`,
        title: term,
        subtitle: strategy.subtitle(this.t),
        kind: ResultKind.COMMAND,
        icon: { name: strategy.iconName },
        score: 1,
        activate: () => strategy.run(this.runner, term),
      },
    ];
  }
}
