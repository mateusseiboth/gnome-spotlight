/**
 * Portas do serviço que libera atalhos do GNOME em conflito com o da busca.
 */

export interface KeybindingLocation {
  readonly schema: string;
  readonly key: string;
}

export interface KeybindingStore {
  read(location: KeybindingLocation): string[];
  write(location: KeybindingLocation, accelerators: readonly string[]): void;
}

/** Guarda, em JSON, o que foi tirado de cada atalho para devolver depois. */
export interface ReleasedBindingStore {
  read(): string;
  write(value: string): void;
}

export interface ReleasedBinding extends KeybindingLocation {
  readonly accelerator: string;
  readonly index: number;
}
