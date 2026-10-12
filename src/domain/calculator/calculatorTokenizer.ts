/**
 * Quebra a expressão em tokens. Aceita vírgula ou ponto como separador decimal (não há
 * função com mais de um argumento, então a vírgula nunca separa argumentos).
 */

export const TokenType = {
  NUMBER: "number",
  IDENTIFIER: "identifier",
  OPERATOR: "operator",
  OPEN_PAREN: "open-paren",
  CLOSE_PAREN: "close-paren",
} as const;
export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  readonly type: TokenType;
  readonly text: string;
}

export class CalculatorSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

interface TokenPattern {
  readonly type: TokenType;
  readonly pattern: RegExp;
  readonly normalize?: (text: string) => string;
}

/** Sinônimos tipográficos viram o operador ASCII equivalente. */
const OPERATOR_ALIASES: Record<string, string> = { "×": "*", "÷": "/", "−": "-" };

const TOKEN_PATTERNS: readonly TokenPattern[] = [
  {
    type: TokenType.NUMBER,
    pattern: /^\d+(?:[.,]\d+)?/,
    normalize: (text) => text.replace(",", "."),
  },
  {
    type: TokenType.IDENTIFIER,
    pattern: /^[a-zπτ][a-z0-9]*/i,
    normalize: (text) => text.toLowerCase(),
  },
  {
    type: TokenType.OPERATOR,
    pattern: /^[+\-*/^%!×÷−]/,
    normalize: (text) => OPERATOR_ALIASES[text] ?? text,
  },
  { type: TokenType.OPEN_PAREN, pattern: /^\(/ },
  { type: TokenType.CLOSE_PAREN, pattern: /^\)/ },
];

interface ReadToken {
  readonly token: Token;
  readonly consumed: number;
}

const readToken = (rest: string): ReadToken => {
  for (const { type, pattern, normalize } of TOKEN_PATTERNS) {
    const match = pattern.exec(rest);
    if (!match) continue;

    const text = match[0];
    return { token: { type, text: normalize ? normalize(text) : text }, consumed: text.length };
  }

  throw new CalculatorSyntaxError(`Caractere inesperado: ${rest[0]}`);
};

export const tokenize = (expression: string): Token[] => {
  const tokens: Token[] = [];
  let rest = expression.trim();

  while (rest.length > 0) {
    const { token, consumed } = readToken(rest);
    tokens.push(token);
    rest = rest.slice(consumed).trimStart();
  }

  return tokens;
};
