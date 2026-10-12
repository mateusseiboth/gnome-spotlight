/**
 * Contrato de um resultado da busca, comum a todos os provedores.
 */
import type Gio from "gi://Gio";

export const ResultKind = {
  APP: "app",
  WINDOW: "window",
  CALCULATOR: "calculator",
  COMMAND: "command",
  FILE: "file",
  FOLDER: "folder",
  SYSTEM: "system",
  WEB: "web",
} as const;
export type ResultKind = (typeof ResultKind)[keyof typeof ResultKind];

/** Ícone pelo nome do tema ou pelo `Gio.Icon` que o GNOME já entrega (apps, janelas). */
export type SearchIcon = { readonly name: string } | { readonly gicon: Gio.Icon };

export interface SearchResult {
  /** Único entre provedores: `<tipo>:<id>`. */
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly kind: ResultKind;
  readonly icon: SearchIcon;
  /** Relevância entre 0 e 1. */
  readonly score: number;
  /** Texto que o Tab coloca na caixa de busca (navegação por pastas). */
  readonly completion?: string;
  activate(): void | Promise<void>;
}
