/**
 * Fundo do painel da busca: translúcido (vidro) quando há quem desfoque atrás dele
 * (Blur my Shell), sólido quando não há.
 */
import { describe, expect, test } from "bun:test";

import { PanelSurface, resolvePanelSurface } from "@domain/appearance/panelSurface";

describe("resolvePanelSurface", () => {
  test("com provedor de blur o painel é de vidro", () => {
    expect(resolvePanelSurface({ hasBlurProvider: true })).toBe(PanelSurface.GLASS);
  });

  test("sem provedor de blur o painel é sólido", () => {
    expect(resolvePanelSurface({ hasBlurProvider: false })).toBe(PanelSurface.SOLID);
  });
});
