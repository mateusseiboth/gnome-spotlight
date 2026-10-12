/**
 * Lê o texto digitado e decide o modo de busca pelo primeiro caractere (strategy map).
 *
 *   `=` calculadora   `>` comando no terminal   `$` comando em segundo plano
 *   `?` busca na web  `/` e `~` caminho de arquivo (o prefixo FAZ PARTE do caminho)
 */

export const QueryMode = {
  DEFAULT: "default",
  CALCULATOR: "calculator",
  TERMINAL_COMMAND: "terminal-command",
  BACKGROUND_COMMAND: "background-command",
  WEB: "web",
  FILES: "files",
} as const;
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];

export interface ParsedQuery {
  readonly mode: QueryMode;
  readonly term: string;
  readonly raw: string;
}

interface PrefixRule {
  readonly mode: QueryMode;
  readonly keepsPrefix: boolean;
}

const PREFIX_RULES: Record<string, PrefixRule> = {
  "=": { mode: QueryMode.CALCULATOR, keepsPrefix: false },
  ">": { mode: QueryMode.TERMINAL_COMMAND, keepsPrefix: false },
  $: { mode: QueryMode.BACKGROUND_COMMAND, keepsPrefix: false },
  "?": { mode: QueryMode.WEB, keepsPrefix: false },
  "/": { mode: QueryMode.FILES, keepsPrefix: true },
  "~": { mode: QueryMode.FILES, keepsPrefix: true },
};

export const parseQuery = (raw: string): ParsedQuery => {
  const text = raw.trim();
  const rule = PREFIX_RULES[text.charAt(0)];
  if (!rule) return { mode: QueryMode.DEFAULT, term: text, raw };

  const term = rule.keepsPrefix ? text : text.slice(1).trim();
  return { mode: rule.mode, term, raw };
};
