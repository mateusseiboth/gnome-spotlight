/**
 * Navegação por caminho (`/` ou `~`). Lista a pasta digitada e filtra pelo trecho final.
 *
 * Pastas vêm antes de arquivos; dentro de cada grupo a nota é arredondada em faixas de 0,1
 * para que nomes parecidos empatem e caiam em ordem alfabética, como num seletor de
 * arquivos, em vez de o mais curto pular na frente.
 */
import type { DirectoryReader, FileEntry } from "@domain/files/filePorts";
import { abbreviateHome, joinPath, parsePathQuery } from "@domain/files/pathQuery";
import type { UriLauncher } from "@domain/launcher/launcherPorts";
import { QueryMode, type ParsedQuery } from "@domain/query/queryParser";
import { byRelevance } from "@domain/search/resultOrdering";
import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { scoreMatch } from "@domain/text/textMatcher";
import { ModeSearchProvider } from "@provider/modeSearchProvider";

const FOLDER_BONUS = 0.5;
const MATCH_SHARE = 0.5;
const EMPTY_PARTIAL_MATCH = 1;

const roundToBand = (score: number): number => Math.round(score * 10) / 10;

const isHidden = (entry: FileEntry): boolean => entry.name.startsWith(".");

export class FileSearchProvider extends ModeSearchProvider {
  constructor(
    private readonly reader: DirectoryReader,
    private readonly launcher: UriLauncher,
    private readonly home: string,
  ) {
    super([QueryMode.FILES]);
  }

  async search({ term }: ParsedQuery): Promise<readonly SearchResult[]> {
    const { directory, partial } = parsePathQuery(term, this.home);
    const entries = await this.readEntries(directory);
    const showsHidden = partial.startsWith(".");

    return entries
      .filter((entry) => showsHidden || !isHidden(entry))
      .flatMap((entry) => this.toResult(entry, directory, partial))
      .sort(byRelevance);
  }

  private async readEntries(directory: string): Promise<readonly FileEntry[]> {
    try {
      return await this.reader.list(directory);
    } catch {
      return [];
    }
  }

  private toResult(entry: FileEntry, directory: string, partial: string): SearchResult[] {
    const match = partial ? scoreMatch(partial, entry.name) : EMPTY_PARTIAL_MATCH;
    if (match <= 0) return [];

    const path = joinPath(directory, entry.name);
    const display = abbreviateHome(path, this.home);

    return [
      {
        id: `file:${path}`,
        title: entry.name,
        subtitle: display,
        kind: entry.isDirectory ? ResultKind.FOLDER : ResultKind.FILE,
        icon: entry.icon,
        score: (entry.isDirectory ? FOLDER_BONUS : 0) + roundToBand(match) * MATCH_SHARE,
        completion: entry.isDirectory ? `${display}/` : display,
        activate: () => this.launcher.openPath(path),
      },
    ];
  }
}
