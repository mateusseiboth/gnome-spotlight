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

export type SearchIcon = { readonly name: string } | { readonly gicon: Gio.Icon };

export interface SearchResult {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly kind: ResultKind;
  readonly icon: SearchIcon;
  readonly score: number;
  readonly completion?: string;
  activate(): void | Promise<void>;
}
