import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(import.meta.dir, "..", "..", "src");
const COMMENT_LINE = /^\s*(\/\/|\/\*)/;

const listSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });

describe("código-fonte", () => {
  test("não tem comentários", () => {
    const commented = listSourceFiles(SRC).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          COMMENT_LINE.test(line) ? [`${relative(SRC, file)}:${index + 1}`] : [],
        ),
    );

    expect(commented).toEqual([]);
  });
});
