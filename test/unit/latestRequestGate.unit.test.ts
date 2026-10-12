/**
 * Busca assíncrona (arquivos) pode responder fora de ordem. Só a última digitação
 * pode pintar a lista.
 */
import { describe, expect, test } from "bun:test";

import { LatestRequestGate } from "@domain/selection/latestRequestGate";

describe("LatestRequestGate", () => {
  test("a requisição mais nova é a única atual", () => {
    const gate = new LatestRequestGate();
    const first = gate.next();
    const second = gate.next();

    expect(gate.isCurrent(first)).toBe(false);
    expect(gate.isCurrent(second)).toBe(true);
  });

  test("invalidar descarta a que estava em andamento", () => {
    const gate = new LatestRequestGate();
    const token = gate.next();
    gate.invalidate();

    expect(gate.isCurrent(token)).toBe(false);
  });
});
