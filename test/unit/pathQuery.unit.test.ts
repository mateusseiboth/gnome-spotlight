/**
 * Caminhos digitados na busca de arquivos: expansão do `~`, separação entre pasta e
 * trecho do nome, e abreviação do home na exibição.
 */
import { describe, expect, test } from "bun:test";

import { abbreviateHome, parsePathQuery } from "@domain/files/pathQuery";

const HOME = "/home/maria";

describe("parsePathQuery", () => {
  test("`~` sozinho lista o home", () => {
    expect(parsePathQuery("~", HOME)).toEqual({ directory: "/home/maria", partial: "" });
  });

  test("barra final lista a pasta inteira", () => {
    expect(parsePathQuery("~/Downloads/", HOME)).toEqual({
      directory: "/home/maria/Downloads",
      partial: "",
    });
  });

  test("último segmento vira o trecho do nome", () => {
    expect(parsePathQuery("~/Doc", HOME)).toEqual({ directory: "/home/maria", partial: "Doc" });
  });

  test("caminho absoluto", () => {
    expect(parsePathQuery("/usr/sh", HOME)).toEqual({ directory: "/usr", partial: "sh" });
  });

  test("a raiz é ela mesma", () => {
    expect(parsePathQuery("/", HOME)).toEqual({ directory: "/", partial: "" });
    expect(parsePathQuery("/et", HOME)).toEqual({ directory: "/", partial: "et" });
  });
});

describe("abbreviateHome", () => {
  test("troca o home por `~`", () => {
    expect(abbreviateHome("/home/maria/Imagens/foto.png", HOME)).toBe("~/Imagens/foto.png");
  });

  test("o próprio home vira `~`", () => {
    expect(abbreviateHome("/home/maria", HOME)).toBe("~");
  });

  test("não confunde prefixo parecido", () => {
    expect(abbreviateHome("/home/mariana/x", HOME)).toBe("/home/mariana/x");
  });
});
