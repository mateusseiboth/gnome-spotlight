/**
 * A factory monta um provedor para cada fonte, e todo modo de busca tem quem responda.
 */
import { describe, expect, test } from "bun:test";

import { QueryMode } from "@domain/query/queryParser";
import { createSearchProviders } from "@provider/searchProviderFactory";
import {
  identity,
  makeAppCatalog,
  makeClipboard,
  makeCommandRunner,
  makeDirectoryReader,
  makeLauncher,
  makeSystemActionCatalog,
  makeWindowCatalog,
} from "@test/support/fakes";

const providers = createSearchProviders({
  apps: makeAppCatalog([]).catalog,
  windows: makeWindowCatalog([]).catalog,
  systemActions: makeSystemActionCatalog([]).catalog,
  directories: makeDirectoryReader({}).reader,
  launcher: makeLauncher().launcher,
  clipboard: makeClipboard().clipboard,
  commands: makeCommandRunner().runner,
  settings: { searchUrl: () => "https://example.com/?q=%s" },
  homeDirectory: "/home/maria",
  translate: identity,
});

describe("createSearchProviders", () => {
  test("cria os sete provedores", () => {
    expect(providers).toHaveLength(7);
  });

  test.each(Object.values(QueryMode))("o modo %p tem pelo menos um provedor", (mode) => {
    expect(providers.some((provider) => provider.answers(mode))).toBe(true);
  });
});
