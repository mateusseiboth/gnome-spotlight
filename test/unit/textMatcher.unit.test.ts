/**
 * Normalização de texto e pontuação de correspondência (fuzzy) usadas por todos os
 * provedores de busca. Funções puras, sem GNOME.
 */
import { describe, expect, test } from "bun:test";

import { normalizeText, scoreMatch, scoreBestField } from "@domain/text/textMatcher";

describe("normalizeText", () => {
  test("remove acentos, caixa e espaços das pontas", () => {
    expect(normalizeText("  Configurações ")).toBe("configuracoes");
  });

  test("colapsa espaços internos", () => {
    expect(normalizeText("Visual   Studio\tCode")).toBe("visual studio code");
  });
});

describe("scoreMatch", () => {
  test("termo vazio não pontua", () => {
    expect(scoreMatch("", "Firefox")).toBe(0);
  });

  test("sem correspondência devolve zero", () => {
    expect(scoreMatch("xyz", "Firefox")).toBe(0);
  });

  test("igualdade exata é a nota máxima", () => {
    expect(scoreMatch("firefox", "Firefox")).toBe(1);
  });

  test("ignora acentos dos dois lados", () => {
    expect(scoreMatch("configuracoes", "Configurações")).toBe(1);
  });

  test("prefixo vence início de palavra, que vence substring", () => {
    const prefix = scoreMatch("ter", "Terminal");
    const wordStart = scoreMatch("ter", "GNOME Terminal");
    const substring = scoreMatch("min", "Terminal");

    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(0);
  });

  test("prefixo em nome mais curto pontua mais", () => {
    expect(scoreMatch("fi", "Files")).toBeGreaterThan(
      scoreMatch("fi", "Firefox Developer Edition"),
    );
  });

  test("iniciais casam com as palavras (acrônimo)", () => {
    const acronym = scoreMatch("vsc", "Visual Studio Code");

    expect(acronym).toBeGreaterThan(0);
    expect(acronym).toBeLessThan(scoreMatch("stu", "Visual Studio Code"));
  });

  test("subsequência fora de ordem não casa; em ordem casa com nota baixa", () => {
    expect(scoreMatch("fxo", "Firefox")).toBe(0);

    const subsequence = scoreMatch("ffx", "Firefox");
    expect(subsequence).toBeGreaterThan(0);
    expect(subsequence).toBeLessThan(scoreMatch("fox", "Firefox"));
  });

  test("termo com várias palavras exige que todas comecem alguma palavra", () => {
    expect(scoreMatch("gno ter", "GNOME Terminal")).toBeGreaterThan(0);
    expect(scoreMatch("gno xyz", "GNOME Terminal")).toBe(0);
  });

  test("a nota fica sempre entre 0 e 1", () => {
    const samples = ["a", "te", "term", "terminal", "gt", "erm"];
    for (const sample of samples) {
      const score = scoreMatch(sample, "GNOME Terminal");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

describe("scoreBestField", () => {
  test("usa o melhor campo ponderado pelo peso", () => {
    const score = scoreBestField("web", [
      { value: "Firefox", weight: 1 },
      { value: "web;browser;internet", weight: 0.8 },
    ]);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(0.8);
  });

  test("ignora campos ausentes", () => {
    expect(
      scoreBestField("fire", [
        { value: undefined, weight: 1 },
        { value: "Firefox", weight: 0.5 },
      ]),
    ).toBeGreaterThan(0);
  });

  test("nenhum campo casando devolve zero", () => {
    expect(scoreBestField("zzz", [{ value: "Firefox", weight: 1 }])).toBe(0);
  });
});
