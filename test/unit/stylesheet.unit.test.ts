/**
 * O CSS claro e o escuro saem do MESMO molde; só os tokens de cor mudam.
 */
import { describe, expect, test } from "bun:test";

import { buildStylesheet, ThemeVariant } from "@style/stylesheet";

describe("buildStylesheet", () => {
  test("gera as duas variantes com as mesmas regras", () => {
    const selectors = (css: string) => [...css.matchAll(/^([^{\n]+)\{/gm)].map((m) => m[1]?.trim());

    const dark = buildStylesheet(ThemeVariant.DARK);
    const light = buildStylesheet(ThemeVariant.LIGHT);

    expect(selectors(dark)).toEqual(selectors(light));
    expect(dark).not.toBe(light);
  });

  test("não sobra token sem substituir", () => {
    for (const variant of Object.values(ThemeVariant)) {
      expect(buildStylesheet(variant)).not.toMatch(/\$\{|\{\{/);
    }
  });

  test("todas as classes ficam no namespace da extensão", () => {
    const css = buildStylesheet(ThemeVariant.DARK);
    const classes = [...css.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]);

    expect(classes.every((name) => name?.startsWith("spotlight-"))).toBe(true);
  });
});
