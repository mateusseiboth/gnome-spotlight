/**
 * Calculadora da busca. Parser descendente recursivo que avalia enquanto lê, sem `eval`.
 *
 * Precedência, da menor para a maior:
 *   soma/subtração  <  multiplicação/divisão (inclui multiplicação implícita: `2pi`, `2(3)`)
 *   <  sinal unário  <  potência (associativa à direita)  <  pós-fixos `%` e `!`
 *
 * Por isso `-2^2` é -4 e `2^-1` é 0,5, como nas calculadoras científicas.
 */
import {
  CalculatorSyntaxError,
  tokenize,
  TokenType,
  type Token,
} from "@domain/calculator/calculatorTokenizer";

export type CalculationResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false };

const SIGNIFICANT_DIGITS = 12;
const MAX_FACTORIAL = 170;

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  π: Math.PI,
  tau: Math.PI * 2,
  τ: Math.PI * 2,
  e: Math.E,
};

const FUNCTIONS: Record<string, (value: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};

const factorial = (value: number): number => {
  if (!Number.isInteger(value) || value < 0 || value > MAX_FACTORIAL) {
    throw new CalculatorSyntaxError("Fatorial só vale para inteiros de 0 a 170.");
  }

  let result = 1;
  for (let factor = 2; factor <= value; factor++) result *= factor;
  return result;
};

const BINARY_ADDITIVE: Record<string, (left: number, right: number) => number> = {
  "+": (left, right) => left + right,
  "-": (left, right) => left - right,
};

const BINARY_MULTIPLICATIVE: Record<string, (left: number, right: number) => number> = {
  "*": (left, right) => left * right,
  "/": (left, right) => left / right,
};

const UNARY_SIGNS: Record<string, (value: number) => number> = {
  "+": (value) => value,
  "-": (value) => -value,
};

const POWER: Record<string, (base: number, exponent: number) => number> = {
  "^": (base, exponent) => base ** exponent,
};

const POSTFIX: Record<string, (value: number) => number> = {
  "%": (value) => value / 100,
  "!": factorial,
};

/** Token que, logo após um fator completo, indica multiplicação implícita. */
const IMPLICIT_MULTIPLICATION_STARTERS: ReadonlySet<TokenType> = new Set([
  TokenType.NUMBER,
  TokenType.IDENTIFIER,
  TokenType.OPEN_PAREN,
]);

class ExpressionParser {
  private position = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  parse(): number {
    if (this.tokens.length === 0) throw new CalculatorSyntaxError("Expressão vazia.");

    const value = this.parseAdditive();
    if (this.peek()) throw new CalculatorSyntaxError(`Sobrou: ${this.peek()?.text}`);
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private consume(): Token {
    const token = this.tokens[this.position++];
    if (!token) throw new CalculatorSyntaxError("Expressão incompleta.");
    return token;
  }

  /** Se o próximo token é um operador da tabela, consome e devolve a operação. */
  private takeOperator<T>(table: Record<string, T>): T | undefined {
    const next = this.peek();
    if (next?.type !== TokenType.OPERATOR) return undefined;

    const operation = table[next.text];
    if (operation === undefined) return undefined;

    this.position++;
    return operation;
  }

  private parseAdditive(): number {
    let value = this.parseMultiplicative();

    for (
      let add = this.takeOperator(BINARY_ADDITIVE);
      add;
      add = this.takeOperator(BINARY_ADDITIVE)
    ) {
      value = add(value, this.parseMultiplicative());
    }

    return value;
  }

  private parseMultiplicative(): number {
    let value = this.parseUnary();

    for (;;) {
      const multiply = this.takeOperator(BINARY_MULTIPLICATIVE);
      if (multiply) {
        value = multiply(value, this.parseUnary());
        continue;
      }

      const next = this.peek();
      if (!next || !IMPLICIT_MULTIPLICATION_STARTERS.has(next.type)) return value;

      value *= this.parseUnary();
    }
  }

  private parseUnary(): number {
    const sign = this.takeOperator(UNARY_SIGNS);
    if (!sign) return this.parsePower();

    return sign(this.parseUnary());
  }

  private parsePower(): number {
    const base = this.parsePostfix();
    const power = this.takeOperator(POWER);
    if (!power) return base;

    return power(base, this.parseUnary());
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();

    for (let apply = this.takeOperator(POSTFIX); apply; apply = this.takeOperator(POSTFIX)) {
      value = apply(value);
    }

    return value;
  }

  private parsePrimary(): number {
    const token = this.consume();

    const parsers: Partial<Record<TokenType, () => number>> = {
      [TokenType.NUMBER]: () => Number(token.text),
      [TokenType.IDENTIFIER]: () => this.parseIdentifier(token.text),
      [TokenType.OPEN_PAREN]: () => this.parseGroup(),
    };

    const parser = parsers[token.type];
    if (!parser) throw new CalculatorSyntaxError(`Inesperado: ${token.text}`);
    return parser();
  }

  private parseGroup(): number {
    const value = this.parseAdditive();
    if (this.consume().type !== TokenType.CLOSE_PAREN)
      throw new CalculatorSyntaxError("Falta fechar parêntese.");
    return value;
  }

  private parseIdentifier(name: string): number {
    const fn = FUNCTIONS[name];
    if (fn && this.peek()?.type === TokenType.OPEN_PAREN) {
      this.consume();
      return fn(this.parseGroup());
    }

    const constant = CONSTANTS[name];
    if (constant === undefined) throw new CalculatorSyntaxError(`Desconhecido: ${name}`);
    return constant;
  }
}

/** Remove o ruído binário (0,1 + 0,2 = 0,30000000000000004) mantendo 12 dígitos. */
const roundSignificant = (value: number): number => Number(value.toPrecision(SIGNIFICANT_DIGITS));

const parseTokens = (expression: string): Token[] | null => {
  try {
    return tokenize(expression);
  } catch (error) {
    if (error instanceof CalculatorSyntaxError) return null;
    throw error;
  }
};

const evaluateTokens = (tokens: readonly Token[]): CalculationResult => {
  try {
    const value = new ExpressionParser(tokens).parse();
    if (!Number.isFinite(value)) return { ok: false };
    return { ok: true, value: roundSignificant(value) };
  } catch (error) {
    if (error instanceof CalculatorSyntaxError) return { ok: false };
    throw error;
  }
};

export const evaluateExpression = (expression: string): CalculationResult => {
  const tokens = parseTokens(expression);
  if (!tokens) return { ok: false };
  return evaluateTokens(tokens);
};

const isOperationToken = (token: Token): boolean =>
  token.type === TokenType.OPERATOR ||
  token.type === TokenType.OPEN_PAREN ||
  token.text in FUNCTIONS;

/**
 * "Isto parece uma conta?" no modo padrão (sem `=`). Exige um dígito e uma operação, para
 * que digitar `e` ou `pi` procurando um app não jogue a calculadora no topo.
 */
export const isMathExpression = (term: string): boolean => {
  if (!/\d/.test(term)) return false;

  const tokens = parseTokens(term);
  if (!tokens?.some(isOperationToken)) return false;

  return evaluateTokens(tokens).ok;
};

/** Quem digitou `2,5` espera a resposta com vírgula. */
export const detectDecimalSeparator = (expression: string): string =>
  /\d,\d/.test(expression) ? "," : ".";

export const formatCalculatorNumber = (value: number, decimalSeparator: string): string =>
  String(roundSignificant(value)).replace(".", decimalSeparator);
