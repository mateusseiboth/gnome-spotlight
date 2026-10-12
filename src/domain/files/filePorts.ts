/**
 * Porta de leitura de pastas para a busca de arquivos.
 */
import type { SearchIcon } from "@domain/search/searchResult";

export interface FileEntry {
  readonly name: string;
  readonly isDirectory: boolean;
  readonly icon: SearchIcon;
}

export interface DirectoryReader {
  list(directory: string): Promise<readonly FileEntry[]>;
}
