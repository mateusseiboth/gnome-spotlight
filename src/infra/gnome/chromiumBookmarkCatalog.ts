import Gio from "gi://Gio";
import GLib from "gi://GLib";

import type { Bookmark, BookmarkCatalog } from "@domain/bookmarks/bookmarkPorts";
import {
  CHROMIUM_BOOKMARK_FILES,
  CHROMIUM_LOCAL_STATE,
  listChromiumConfigDirectories,
  mergeBookmarks,
  parseChromiumBookmarks,
  resolveChromiumProfile,
} from "@domain/bookmarks/chromiumBookmarks";

Gio._promisify(Gio.File.prototype, "query_info_async", "query_info_finish");
Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");

interface CachedFile<T> {
  readonly modified: number;
  readonly value: T;
}

const decoder = new TextDecoder();

export class ChromiumBookmarkCatalog implements BookmarkCatalog {
  private readonly cache = new Map<string, CachedFile<unknown>>();
  private readonly directories = {
    home: GLib.get_home_dir(),
    config: GLib.get_user_config_dir(),
  };

  async list(): Promise<readonly Bookmark[]> {
    const desktopId = Gio.AppInfo.get_default_for_uri_scheme("https")?.get_id();
    if (!desktopId) return [];

    for (const directory of listChromiumConfigDirectories(desktopId, this.directories)) {
      const profile = await this.read(
        `${directory}/${CHROMIUM_LOCAL_STATE}`,
        resolveChromiumProfile,
      );
      if (profile === undefined) continue;

      const lists = await Promise.all(
        CHROMIUM_BOOKMARK_FILES.map((name) =>
          this.read(`${directory}/${profile}/${name}`, parseChromiumBookmarks),
        ),
      );
      return mergeBookmarks(lists.map((list) => list ?? []));
    }

    return [];
  }

  private async read<T>(path: string, parse: (content: string) => T): Promise<T | undefined> {
    const file = Gio.File.new_for_path(path);
    try {
      const info = await file.query_info_async(
        Gio.FILE_ATTRIBUTE_TIME_MODIFIED,
        Gio.FileQueryInfoFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null,
      );
      const modified = info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_TIME_MODIFIED);
      const cached = this.cache.get(path);
      if (cached?.modified === modified) return cached.value as T;

      const [contents] = await file.load_contents_async(null);
      const value = parse(decoder.decode(contents));
      this.cache.set(path, { modified, value });
      return value;
    } catch {
      this.cache.delete(path);
      return undefined;
    }
  }
}
