/**
 * Leitura do texto digitado: qual modo de busca o prefixo escolhe e qual termo sobra.
 */
import { describe, expect, test } from "bun:test";

import { parseQuery, QueryMode } from "@domain/query/queryParser";

describe("parseQuery", () => {
  test("texto comum cai no modo padrão, aparado", () => {
    expect(parseQuery("  firefox ")).toEqual({
      mode: QueryMode.DEFAULT,
      term: "firefox",
      raw: "  firefox ",
    });
  });

  test.each([
    ["=2+2", QueryMode.CALCULATOR, "2+2"],
    ["> htop", QueryMode.TERMINAL_COMMAND, "htop"],
    ["$ notify-send oi", QueryMode.BACKGROUND_COMMAND, "notify-send oi"],
    ["? gnome shell", QueryMode.WEB, "gnome shell"],
  ])("%p escolhe o modo pelo prefixo e remove o prefixo", (raw, mode, term) => {
    const parsed = parseQuery(raw);

    expect(parsed.mode).toBe(mode);
    expect(parsed.term).toBe(term);
  });

  test.each([
    ["/usr/share", "/usr/share"],
    ["~/Downloads", "~/Downloads"],
    ["~", "~"],
  ])("%p é caminho e mantém o prefixo no termo", (raw, term) => {
    const parsed = parseQuery(raw);

    expect(parsed.mode).toBe(QueryMode.FILES);
    expect(parsed.term).toBe(term);
  });

  test("texto vazio continua no modo padrão com termo vazio", () => {
    expect(parseQuery("   ").term).toBe("");
  });
});
