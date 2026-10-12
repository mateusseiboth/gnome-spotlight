/**
 * Orquestração da busca: escolhe os provedores do modo, junta, ordena por nota e corta
 * no limite. Provedor que falha não derruba os demais.
 */
import { describe, expect, test } from "bun:test";

import type { QueryMode } from "@domain/query/queryParser";
import type { SearchProvider } from "@domain/search/searchProvider";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { SearchService } from "@service/searchService";

const result = (id: string, score: number, title = id): SearchResult => ({
  id,
  title,
  kind: ResultKind.APP,
  icon: { name: "x" },
  score,
  activate: () => {},
});

const provider = (modes: QueryMode[], results: SearchResult[] | Error): SearchProvider => ({
  answers: (mode) => modes.includes(mode),
  search: async () => {
    if (results instanceof Error) throw results;
    return results;
  },
});

describe("SearchService", () => {
  test("termo vazio não consulta ninguém", async () => {
    let called = false;
    const spy: SearchProvider = {
      answers: () => true,
      search: async () => {
        called = true;
        return [];
      },
    };

    const service = new SearchService([spy], () => 8);

    expect(await service.search("  ")).toEqual([]);
    expect(called).toBe(false);
  });

  test("junta provedores do modo e ordena pela nota", async () => {
    const service = new SearchService(
      [
        provider(["default"], [result("a", 0.5)]),
        provider(["default"], [result("b", 0.9), result("c", 0.1)]),
      ],
      () => 8,
    );

    const results = await service.search("x");

    expect(results.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  test("empate na nota ordena pelo título", async () => {
    const service = new SearchService(
      [provider(["default"], [result("2", 0.5, "Zeta"), result("1", 0.5, "Alfa")])],
      () => 8,
    );

    expect((await service.search("x")).map((r) => r.title)).toEqual(["Alfa", "Zeta"]);
  });

  test("ignora provedores de outro modo", async () => {
    const service = new SearchService(
      [
        provider(["default"], [result("app", 1)]),
        provider(["terminal-command"], [result("cmd", 1)]),
      ],
      () => 8,
    );

    expect((await service.search("> htop")).map((r) => r.id)).toEqual(["cmd"]);
  });

  test("corta no limite configurado", async () => {
    const many = Array.from({ length: 20 }, (_, i) => result(`r${i}`, 1 - i / 100));
    const service = new SearchService([provider(["default"], many)], () => 5);

    expect(await service.search("x")).toHaveLength(5);
  });

  test("provedor com erro é ignorado", async () => {
    const service = new SearchService(
      [provider(["default"], new Error("falhou")), provider(["default"], [result("ok", 1)])],
      () => 8,
    );

    expect((await service.search("x")).map((r) => r.id)).toEqual(["ok"]);
  });

  test("resultado repetido (mesmo id) aparece uma vez, com a maior nota", async () => {
    const service = new SearchService(
      [provider(["default"], [result("dup", 0.4)]), provider(["default"], [result("dup", 0.8)])],
      () => 8,
    );

    const results = await service.search("x");

    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBe(0.8);
  });
});
