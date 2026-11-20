import { describe, expect, test } from "bun:test";

import { parseQuery } from "@domain/query/queryParser";
import { ResultKind } from "@domain/search/searchResult";
import { KeywordSearchProvider } from "@provider/keywordSearchProvider";
import { identity, makeLauncher } from "@test/support/fakes";

const settings = {
  searchUrl: () => "https://www.google.com/search?q=%s",
  keywordSearches: () => ({ "@y": "https://www.youtube.com/results?search_query=%s" }),
  searchBookmarks: () => true,
};

describe("KeywordSearchProvider", () => {
  test("`@y gatos` abre a busca do site configurado no topo da lista", async () => {
    const { launcher, uris } = makeLauncher();
    const provider = new KeywordSearchProvider(launcher, settings, identity);

    const [result] = await provider.search(parseQuery("@y gatos fofos"));
    await result?.activate();

    expect(result?.title).toBe("Search youtube.com for “gatos fofos”");
    expect(result?.kind).toBe(ResultKind.WEB);
    expect(result?.score).toBe(1);
    expect(uris).toEqual(["https://www.youtube.com/results?search_query=gatos%20fofos"]);
  });

  test("texto sem atalho configurado não gera resultado", async () => {
    const provider = new KeywordSearchProvider(makeLauncher().launcher, settings, identity);

    expect(await provider.search(parseQuery("@w gatos"))).toEqual([]);
    expect(await provider.search(parseQuery("@y"))).toEqual([]);
  });

  test("lê os atalhos a cada busca, sem precisar reabrir", async () => {
    const searches: Record<string, string> = {};
    const provider = new KeywordSearchProvider(
      makeLauncher().launcher,
      { ...settings, keywordSearches: () => searches },
      identity,
    );

    searches["@gh"] = "https://github.com/search?q=%s";

    expect(await provider.search(parseQuery("@gh gnome"))).toHaveLength(1);
  });
});
