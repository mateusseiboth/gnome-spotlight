/**
 * Porta do catálogo de aplicativos instalados (no GNOME: `Shell.AppSystem`).
 */
import type { SearchIcon } from "@domain/search/searchResult";

export interface AppEntry {
  readonly id: string;
  readonly name: string;
  readonly genericName?: string;
  readonly description?: string;
  readonly executable?: string;
  readonly keywords: readonly string[];
  readonly icon: SearchIcon;
  /** Frequência de uso normalizada entre 0 (nunca) e 1 (o mais usado). */
  readonly usage: number;
}

export interface AppCatalog {
  list(): readonly AppEntry[];
  launch(id: string): void;
}
