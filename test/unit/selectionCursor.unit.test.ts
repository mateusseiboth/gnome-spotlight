/**
 * Estado da linha selecionada na lista de resultados (setas para cima e para baixo).
 */
import { describe, expect, test } from "bun:test";

import { SelectionCursor } from "@domain/selection/selectionCursor";

describe("SelectionCursor", () => {
  test("lista vazia não tem seleção", () => {
    const cursor = new SelectionCursor();
    cursor.reset(0);

    expect(cursor.index).toBe(-1);
  });

  test("ao receber resultados seleciona o primeiro", () => {
    const cursor = new SelectionCursor();
    cursor.reset(3);

    expect(cursor.index).toBe(0);
  });

  test("anda para baixo e dá a volta no fim", () => {
    const cursor = new SelectionCursor();
    cursor.reset(3);

    cursor.move(1);
    cursor.move(1);
    expect(cursor.index).toBe(2);

    cursor.move(1);
    expect(cursor.index).toBe(0);
  });

  test("para cima a partir do primeiro vai ao último", () => {
    const cursor = new SelectionCursor();
    cursor.reset(4);

    cursor.move(-1);

    expect(cursor.index).toBe(3);
  });

  test("mover sem itens continua sem seleção", () => {
    const cursor = new SelectionCursor();
    cursor.reset(0);
    cursor.move(1);

    expect(cursor.index).toBe(-1);
  });

  test("selecionar direto respeita os limites", () => {
    const cursor = new SelectionCursor();
    cursor.reset(2);

    cursor.select(1);
    expect(cursor.index).toBe(1);

    cursor.select(9);
    expect(cursor.index).toBe(1);
  });
});
