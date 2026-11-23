import type { Bookmark, BookmarkCatalog } from "@domain/bookmarks/bookmarkPorts";
import type { SearchSettings, UriLauncher } from "@domain/launcher/launcherPorts";
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { byRelevance } from "@domain/search/resultOrdering";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { scoreBestField } from "@domain/text/textMatcher";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const BOOKMARK_SHARE = 0.9;
const MIN_MATCH = 0.45;
const MAX_BOOKMARKS = 5;
const HOST = /^https?:\/\/(?:www\.)?([^/:?#]+)/i;

const hostOf = (url: string): string | undefined => HOST.exec(url)?.[1];

export class BookmarkSearchProvider extends ModeSearchProvider {
  constructor(
    private readonly catalog: BookmarkCatalog,
    private readonly launcher: UriLauncher,
    private readonly settings: SearchSettings,
  ) {
    super([QueryMode.DEFAULT]);
  }

  async search({ term }: ParsedQuery): Promise<readonly SearchResult[]> {
    if (!this.settings.searchBookmarks()) return [];

    const bookmarks = await this.catalog.list();
    return bookmarks
      .flatMap((bookmark) => this.toResult(bookmark, term))
      .sort(byRelevance)
      .slice(0, MAX_BOOKMARKS);
  }

  private toResult(bookmark: Bookmark, term: string): SearchResult[] {
    const match = scoreBestField(term, [
      { value: bookmark.title, weight: 1 },
      { value: hostOf(bookmark.url), weight: 0.8 },
    ]);
    if (match < MIN_MATCH) return [];

    return [
      {
        id: `bookmark:${bookmark.url}`,
        title: bookmark.title,
        subtitle: bookmark.url,
        kind: ResultKind.BOOKMARK,
        icon: { name: "user-bookmarks-symbolic" },
        score: match * BOOKMARK_SHARE,
        activate: () => this.launcher.openUri(bookmark.url),
      },
    ];
  }
}
