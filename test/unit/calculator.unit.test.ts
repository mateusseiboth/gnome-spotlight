/**
 * Calculadora da busca: tokenização, precedência, funções, constantes, formatação e a
 * detecção de "isto parece uma conta". Sem eval: parser próprio, função pura.
 */
import { describe, expect, test } from "bun:test";

import {
  evaluateExpression,
  formatCalculatorNumber,
  isMathExpression,
} from "@domain/calculator/calculator";

const valueOf = (expression: string): number => {
  const result = evaluateExpression(expression);
  if (!result.ok) throw new Error(`expressão deveria ser válida: ${expression}`);
  return result.value;
};

describe("evaluateExpression", () => {
  test.each([
    ["1 + 2", 3],
    ["2 + 3 * 4", 14],
    ["(2 + 3) * 4", 20],
    ["10 / 4", 2.5],
    ["2 ^ 3 ^ 2", 512],
    ["-2 ^ 2", -4],
    ["2 ^ -1", 0.5],
    ["--3", 3],
    ["7 - -2", 9],
    ["50%", 0.5],
    ["200 * 10%", 20],
    ["5!", 120],
    ["0!", 1],
    ["3 × 4 ÷ 2", 6],
    ["2,5 * 2", 5],
    ["1.5 + 1.5", 3],
    ["sqrt(16)", 4],
    ["abs(-3)", 3],
    ["log(1000)", 3],
    ["ln(e)", 1],
    ["log2(8)", 3],
    ["round(2.5)", 3],
    ["floor(2.9)", 2],
    ["ceil(2.1)", 3],
    ["cos(0)", 1],
    ["2pi", 2 * Math.PI],
    ["2(3 + 1)", 8],
    ["(1 + 1)(2 + 2)", 8],
    ["π", Math.PI],
    ["tau / 2", Math.PI],
  ])("%s = %p", (expression, expected) => {
    expect(valueOf(expression)).toBeCloseTo(expected, 10);
  });

  test("elimina o ruído de ponto flutuante", () => {
    expect(valueOf("0.1 + 0.2")).toBe(0.3);
  });

  test.each([
    [""],
    ["   "],
    ["1 +"],
    ["(1 + 2"],
    ["1 + 2)"],
    ["foo(2)"],
    ["2 $ 3"],
    ["1 / 0"],
    ["sqrt(-1)"],
    ["2.5!"],
    ["171!"],
    ["1..2"],
  ])("%p é inválida", (expression) => {
    expect(evaluateExpression(expression).ok).toBe(false);
  });
});

describe("isMathExpression", () => {
  test.each([["1+1"], ["2 * pi"], ["sqrt(2)"], ["10%"], ["(3)"], ["5!"], ["-4"]])(
    "%p parece conta",
    (term) => {
      expect(isMathExpression(term)).toBe(true);
    },
  );

  test.each([["firefox"], ["e"], ["pi"], ["2024"], [""], ["3,14"], ["1 +"], ["terminal 2"]])(
    "%p não parece conta",
    (term) => {
      expect(isMathExpression(term)).toBe(false);
    },
  );
});

describe("formatCalculatorNumber", () => {
  test("inteiro sai sem casas decimais", () => {
    expect(formatCalculatorNumber(42, ".")).toBe("42");
  });

  test("respeita o separador decimal pedido", () => {
    expect(formatCalculatorNumber(2.5, ",")).toBe("2,5");
  });

  test("limita a 12 dígitos significativos e corta zeros à direita", () => {
    expect(formatCalculatorNumber(Math.PI, ".")).toBe("3.14159265359");
    expect(formatCalculatorNumber(1 / 3, ".")).toBe("0.333333333333");
  });

  test("número muito grande usa notação científica", () => {
    expect(formatCalculatorNumber(1e21, ".")).toBe("1e+21");
  });
});
