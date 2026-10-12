/**
 * Porta das ações do sistema (no GNOME: `misc/systemActions.js`, que já sabe quais estão
 * disponíveis e casa as palavras-chave traduzidas).
 */

export interface SystemActionEntry {
  readonly id: string;
  readonly name: string;
  readonly iconName: string;
}

export interface SystemActionCatalog {
  findMatching(term: string): readonly SystemActionEntry[];
  activate(id: string): void;
}
