/**
 * Rótulo exibido à direita de cada resultado ("App", "Janela"...), um por tipo.
 */
import { describe, expect, test } from "bun:test";

import { getResultKindLabel } from "@domain/search/resultKindLabel";
import { ResultKind } from "@domain/search/searchResult";

describe("getResultKindLabel", () => {
  test.each(Object.values(ResultKind))("o tipo %p tem rótulo", (kind) => {
    expect(getResultKindLabel(kind, (m) => m).length).toBeGreaterThan(0);
  });

  test("passa o rótulo pela tradução", () => {
    expect(getResultKindLabel(ResultKind.WINDOW, (m) => `pt:${m}`)).toBe("pt:Window");
  });
});
