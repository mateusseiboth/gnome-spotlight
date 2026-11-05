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
  searchUrl(): string;
}
