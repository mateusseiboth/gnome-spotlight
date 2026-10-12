/**
 * Formatação de mensagens traduzidas com `%s` (o `String.prototype.format` do GJS não
 * existe fora do Shell, então a extensão usa a própria função).
 */
import { describe, expect, test } from "bun:test";

import { formatMessage } from "@i18n/translate";

describe("formatMessage", () => {
  test("substitui cada %s na ordem", () => {
    expect(formatMessage("Buscar “%s” em %s", "gnome", "Google")).toBe("Buscar “gnome” em Google");
  });

  test("argumento faltando vira texto vazio", () => {
    expect(formatMessage("Abrir %s e %s", "a")).toBe("Abrir a e ");
  });

  test("não interpreta %s dentro do argumento", () => {
    expect(formatMessage("[%s] %s", "%s", "x")).toBe("[%s] x");
  });
});
