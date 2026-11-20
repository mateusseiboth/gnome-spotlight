import { describe, expect, test } from "bun:test";

import {
  listChromiumConfigDirectories,
  mergeBookmarks,
  parseChromiumBookmarks,
  resolveChromiumProfile,
} from "@domain/bookmarks/chromiumBookmarks";

const DIRECTORIES = { home: "/home/maria", config: "/home/maria/.config" };

const BOOKMARKS_FILE = JSON.stringify({
  roots: {
    bookmark_bar: {
      type: "folder",
      children: [
        { type: "url", name: "YouTube", url: "https://www.youtube.com/" },
        {
          type: "folder",
          name: "Dev",
          children: [{ type: "url", name: "GitHub", url: "https://github.com/" }],
        },
        { type: "url", name: "Bookmarklet", url: "javascript:alert(1)" },
        { type: "url", name: "", url: "http://example.com/" },
      ],
    },
    other: { type: "folder", children: [] },
  },
  version: 1,
});

describe("listChromiumConfigDirectories", () => {
  test("Chrome procura a pasta nativa e a do flatpak", () => {
    expect(listChromiumConfigDirectories("com.google.Chrome.desktop", DIRECTORIES)).toEqual([
      "/home/maria/.config/google-chrome",
      "/home/maria/.var/app/com.google.Chrome/config/google-chrome",
    ]);
  });

  test("Chromium também procura no snap", () => {
    expect(listChromiumConfigDirectories("chromium_chromium.desktop", DIRECTORIES)).toContain(
      "/home/maria/snap/chromium/common/chromium",
    );
  });

  test("navegador fora da família Chromium não tem pasta", () => {
    expect(listChromiumConfigDirectories("org.mozilla.firefox.desktop", DIRECTORIES)).toEqual([]);
  });
});

describe("resolveChromiumProfile", () => {
  test("usa o último perfil aberto", () => {
    expect(resolveChromiumProfile('{"profile":{"last_used":"Profile 2"}}')).toBe("Profile 2");
  });

  test("sem último perfil, ou com JSON quebrado, usa Default", () => {
    expect(resolveChromiumProfile('{"profile":{}}')).toBe("Default");
    expect(resolveChromiumProfile("{quebrado")).toBe("Default");
  });

  test("nome de perfil com barra ou `..` não sai da pasta do navegador", () => {
    expect(resolveChromiumProfile('{"profile":{"last_used":"../../etc"}}')).toBe("Default");
    expect(resolveChromiumProfile('{"profile":{"last_used":".."}}')).toBe("Default");
  });
});

describe("parseChromiumBookmarks", () => {
  test("percorre as pastas e guarda só endereços web", () => {
    expect(parseChromiumBookmarks(BOOKMARKS_FILE)).toEqual([
      { title: "YouTube", url: "https://www.youtube.com/" },
      { title: "GitHub", url: "https://github.com/" },
      { title: "http://example.com/", url: "http://example.com/" },
    ]);
  });

  test("arquivo quebrado não gera favorito", () => {
    expect(parseChromiumBookmarks("{")).toEqual([]);
    expect(parseChromiumBookmarks("[]")).toEqual([]);
  });
});

describe("mergeBookmarks", () => {
  test("junta as listas e o mesmo endereço aparece uma vez", () => {
    const local = [{ title: "YouTube", url: "https://www.youtube.com/" }];
    const account = [
      { title: "YT", url: "https://www.youtube.com/" },
      { title: "GitHub", url: "https://github.com/" },
    ];

    expect(mergeBookmarks([local, account])).toEqual([
      { title: "YouTube", url: "https://www.youtube.com/" },
      { title: "GitHub", url: "https://github.com/" },
    ]);
  });
});
