import { describe, expect, test } from "bun:test";

import { parseQuery } from "@domain/query/queryParser";
import { ResultKind } from "@domain/search/searchResult";
import { BookmarkSearchProvider } from "@provider/bookmarkSearchProvider";
import { makeBookmarkCatalog, makeLauncher } from "@test/support/fakes";

const BOOKMARKS = [
  { title: "YouTube", url: "https://www.youtube.com/" },
  { title: "Meu repositório", url: "https://github.com/maria/projeto" },
  { title: "Notícias", url: "https://example.com/news" },
];

const settings = (enabled = true) => ({
  searchUrl: () => "https://example.com/?q=%s",
  keywordSearches: () => ({}),
  searchBookmarks: () => enabled,
});

describe("BookmarkSearchProvider", () => {
  test("`youtube` abre o favorito, não uma busca", async () => {
    const { launcher, uris } = makeLauncher();
    const provider = new BookmarkSearchProvider(
      makeBookmarkCatalog(BOOKMARKS).catalog,
      launcher,
      settings(),
    );

    const [result] = await provider.search(parseQuery("youtube"));
    await result?.activate();

    expect(result?.title).toBe("YouTube");
    expect(result?.kind).toBe(ResultKind.BOOKMARK);
    expect(result?.score).toBeCloseTo(0.9);
    expect(uris).toEqual(["https://www.youtube.com/"]);
  });

  test("casa também pelo domínio do endereço", async () => {
    const provider = new BookmarkSearchProvider(
      makeBookmarkCatalog(BOOKMARKS).catalog,
      makeLauncher().launcher,
      settings(),
    );

    const [result] = await provider.search(parseQuery("github"));

    expect(result?.title).toBe("Meu repositório");
  });

  test("letras soltas em ordem não bastam para trazer favorito", async () => {
    const provider = new BookmarkSearchProvider(
      makeBookmarkCatalog(BOOKMARKS).catalog,
      makeLauncher().launcher,
      settings(),
    );

    expect(await provider.search(parseQuery("ytb"))).toEqual([]);
  });

  test("desligado nas preferências, não consulta os favoritos", async () => {
    const provider = new BookmarkSearchProvider(
      makeBookmarkCatalog(BOOKMARKS).catalog,
      makeLauncher().launcher,
      settings(false),
    );

    expect(await provider.search(parseQuery("youtube"))).toEqual([]);
  });

  test("não responde nos modos com prefixo", () => {
    const provider = new BookmarkSearchProvider(
      makeBookmarkCatalog(BOOKMARKS).catalog,
      makeLauncher().launcher,
      settings(),
    );

    expect(provider.answers(parseQuery("?youtube").mode)).toBe(false);
  });
});
