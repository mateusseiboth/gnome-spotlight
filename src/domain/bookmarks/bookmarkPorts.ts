export interface Bookmark {
  readonly title: string;
  readonly url: string;
}

export interface BookmarkCatalog {
  list(): Promise<readonly Bookmark[]>;
}
