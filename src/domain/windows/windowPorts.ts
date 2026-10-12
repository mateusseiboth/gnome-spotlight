/**
 * Porta das janelas abertas (no GNOME: `Shell.WindowTracker` + `Meta.Window`).
 */
import type { SearchIcon } from "@domain/search/searchResult";

export interface WindowEntry {
  readonly id: string;
  readonly title: string;
  readonly appName: string;
  readonly icon: SearchIcon;
}

export interface WindowCatalog {
  list(): readonly WindowEntry[];
  focus(id: string): void;
}
