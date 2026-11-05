import type { SearchIcon } from "@domain/search/searchResult";

export interface AppEntry {
  readonly id: string;
  readonly name: string;
  readonly genericName?: string;
  readonly description?: string;
  readonly executable?: string;
  readonly keywords: readonly string[];
  readonly icon: SearchIcon;
  readonly usage: number;
}

export interface AppCatalog {
  list(): readonly AppEntry[];
  launch(id: string): void;
}
