/**
 * Portas de efeito colateral da ativação de resultados.
 */

export interface UriLauncher {
  openUri(uri: string): void;
  openPath(path: string): void;
}

export interface Clipboard {
  setText(text: string): void;
}

export interface CommandRunner {
  runInTerminal(command: string): void;
  runInBackground(command: string): void;
}

export interface SearchSettings {
  /** Modelo de URL com `%s` no lugar do termo. */
  searchUrl(): string;
}
