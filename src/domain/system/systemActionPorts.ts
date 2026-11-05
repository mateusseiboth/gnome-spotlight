export interface SystemActionEntry {
  readonly id: string;
  readonly name: string;
  readonly iconName: string;
}

export interface SystemActionCatalog {
  findMatching(term: string): readonly SystemActionEntry[];
  activate(id: string): void;
}
