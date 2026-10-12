/**
 * Lista uma pasta de forma assíncrona (não trava o Shell em pasta de rede lenta).
 * Lê no máximo `MAX_ENTRIES` itens: a lista exibida é curta de qualquer jeito.
 */
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import type { DirectoryReader, FileEntry } from "@domain/files/filePorts";

const ATTRIBUTES = "standard::name,standard::type,standard::symbolic-icon";
const MAX_ENTRIES = 500;
const BATCH_SIZE = 100;

Gio._promisify(Gio.File.prototype, "enumerate_children_async", "enumerate_children_finish");
Gio._promisify(Gio.FileEnumerator.prototype, "next_files_async", "next_files_finish");

const toEntry = (info: Gio.FileInfo): FileEntry => {
  const isDirectory = info.get_file_type() === Gio.FileType.DIRECTORY;
  const gicon = info.get_symbolic_icon();
  return {
    name: info.get_name(),
    isDirectory,
    icon: gicon ? { gicon } : { name: isDirectory ? "folder-symbolic" : "text-x-generic-symbolic" },
  };
};

export class GioDirectoryReader implements DirectoryReader {
  async list(directory: string): Promise<readonly FileEntry[]> {
    const enumerator = await Gio.File.new_for_path(directory).enumerate_children_async(
      ATTRIBUTES,
      Gio.FileQueryInfoFlags.NONE,
      GLib.PRIORITY_DEFAULT,
      null,
    );

    const entries: FileEntry[] = [];
    while (entries.length < MAX_ENTRIES) {
      const batch = await enumerator.next_files_async(BATCH_SIZE, GLib.PRIORITY_DEFAULT, null);
      if (batch.length === 0) break;
      entries.push(...batch.map(toEntry));
    }

    enumerator.close_async(GLib.PRIORITY_DEFAULT, null, null);
    return entries;
  }
}
