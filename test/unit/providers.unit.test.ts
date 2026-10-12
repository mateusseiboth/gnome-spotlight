/**
 * Cada provedor (strategy) da busca: em que modo responde, como pontua e o que a
 * ativação do resultado faz. Portas falsas, sem GNOME.
 */
import { describe, expect, test } from "bun:test";

import { parseQuery } from "@domain/query/queryParser";
import { ResultKind } from "@domain/search/searchResult";
import { AppSearchProvider } from "@provider/appSearchProvider";
import { CalculatorSearchProvider } from "@provider/calculatorSearchProvider";
import { CommandSearchProvider } from "@provider/commandSearchProvider";
import { FileSearchProvider } from "@provider/fileSearchProvider";
import { SystemActionSearchProvider } from "@provider/systemActionSearchProvider";
import { WebSearchProvider } from "@provider/webSearchProvider";
import { WindowSearchProvider } from "@provider/windowSearchProvider";
import {
  identity,
  makeApp,
  makeAppCatalog,
  makeClipboard,
  makeCommandRunner,
  makeDirectoryReader,
  makeLauncher,
  makeSystemActionCatalog,
  makeWindowCatalog,
} from "@test/support/fakes";

describe("AppSearchProvider", () => {
  const apps = [
    makeApp({ id: "org.gnome.Ptyxis.desktop", name: "Terminal", keywords: ["shell", "prompt"] }),
    makeApp({
      id: "firefox.desktop",
      name: "Firefox",
      genericName: "Web Browser",
      keywords: ["internet"],
    }),
    makeApp({ id: "org.gnome.Nautilus.desktop", name: "Files", executable: "nautilus" }),
  ];

  test("encontra pelo nome e lança o app escolhido", async () => {
    const { catalog, launched } = makeAppCatalog(apps);
    const provider = new AppSearchProvider(catalog);

    const [first] = await provider.search(parseQuery("ter"));
    await first?.activate();

    expect(first?.title).toBe("Terminal");
    expect(first?.kind).toBe(ResultKind.APP);
    expect(launched).toEqual(["org.gnome.Ptyxis.desktop"]);
  });

  test("encontra por palavra-chave, nome genérico e executável", async () => {
    const provider = new AppSearchProvider(makeAppCatalog(apps).catalog);

    const titles = async (term: string) =>
      (await provider.search(parseQuery(term))).map((r) => r.title);

    expect(await titles("shell")).toEqual(["Terminal"]);
    expect(await titles("browser")).toEqual(["Firefox"]);
    expect(await titles("nautilus")).toEqual(["Files"]);
  });

  test("nome vale mais que palavra-chave", async () => {
    const provider = new AppSearchProvider(
      makeAppCatalog([
        makeApp({ id: "a", name: "Editor", keywords: ["texto"] }),
        makeApp({ id: "b", name: "Texto", keywords: [] }),
      ]).catalog,
    );

    const results = await provider.search(parseQuery("texto"));

    expect(results.map((r) => r.title)).toEqual(["Texto", "Editor"]);
  });

  test("uso frequente desempata", async () => {
    const provider = new AppSearchProvider(
      makeAppCatalog([
        makeApp({ id: "pouco", name: "Calc A", usage: 0 }),
        makeApp({ id: "muito", name: "Calc B", usage: 1 }),
      ]).catalog,
    );

    const results = await provider.search(parseQuery("calc"));

    expect(results[0]?.id).toBe("app:muito");
  });

  test("só responde no modo padrão", () => {
    const provider = new AppSearchProvider(makeAppCatalog(apps).catalog);

    expect(provider.answers(parseQuery("ter").mode)).toBe(true);
    expect(provider.answers(parseQuery("> ter").mode)).toBe(false);
  });
});

describe("WindowSearchProvider", () => {
  test("acha pelo título ou pelo app e foca a janela", async () => {
    const { catalog, focused } = makeWindowCatalog([
      { id: "1", title: "README.md - Code", appName: "Visual Studio Code", icon: { name: "code" } },
      { id: "2", title: "Caixa de entrada", appName: "Thunderbird", icon: { name: "mail" } },
    ]);
    const provider = new WindowSearchProvider(catalog, identity);

    const byTitle = await provider.search(parseQuery("readme"));
    const byApp = await provider.search(parseQuery("thunder"));
    await byApp[0]?.activate();

    expect(byTitle.map((r) => r.id)).toEqual(["window:1"]);
    expect(byApp[0]?.kind).toBe(ResultKind.WINDOW);
    expect(focused).toEqual(["2"]);
  });

  test("janela pontua abaixo de app com o mesmo nome", async () => {
    const window = new WindowSearchProvider(
      makeWindowCatalog([{ id: "1", title: "Firefox", appName: "Firefox", icon: { name: "x" } }])
        .catalog,
      identity,
    );
    const app = new AppSearchProvider(
      makeAppCatalog([makeApp({ id: "f", name: "Firefox" })]).catalog,
    );

    const [windowResult] = await window.search(parseQuery("firefox"));
    const [appResult] = await app.search(parseQuery("firefox"));

    expect(windowResult!.score).toBeLessThan(appResult!.score);
  });
});

describe("CalculatorSearchProvider", () => {
  test("conta no modo padrão aparece no topo e copia o resultado", async () => {
    const { clipboard, copied } = makeClipboard();
    const provider = new CalculatorSearchProvider(clipboard, identity);

    const [result] = await provider.search(parseQuery("2 + 2 * 10"));
    await result?.activate();

    expect(result?.title).toBe("22");
    expect(result?.kind).toBe(ResultKind.CALCULATOR);
    expect(result?.score).toBeGreaterThanOrEqual(0.95);
    expect(copied).toEqual(["22"]);
  });

  test("usa vírgula na resposta quando a conta usou vírgula", async () => {
    const provider = new CalculatorSearchProvider(makeClipboard().clipboard, identity);

    const [result] = await provider.search(parseQuery("2,5 * 3"));

    expect(result?.title).toBe("7,5");
  });

  test("texto que não é conta não gera resultado no modo padrão", async () => {
    const provider = new CalculatorSearchProvider(makeClipboard().clipboard, identity);

    expect(await provider.search(parseQuery("firefox"))).toEqual([]);
  });

  test("no modo `=` aceita constante sozinha", async () => {
    const provider = new CalculatorSearchProvider(makeClipboard().clipboard, identity);

    const [result] = await provider.search(parseQuery("=pi"));

    expect(result?.title).toBe("3.14159265359");
  });

  test("expressão inválida não gera resultado", async () => {
    const provider = new CalculatorSearchProvider(makeClipboard().clipboard, identity);

    expect(await provider.search(parseQuery("=1/0"))).toEqual([]);
  });
});

describe("CommandSearchProvider", () => {
  test("`>` roda no terminal", async () => {
    const { runner, terminal } = makeCommandRunner();
    const provider = new CommandSearchProvider(runner, identity);

    const [result] = await provider.search(parseQuery("> htop"));
    await result?.activate();

    expect(result?.title).toBe("htop");
    expect(result?.subtitle).toBe("Run in terminal");
    expect(terminal).toEqual(["htop"]);
  });

  test("`$` roda em segundo plano", async () => {
    const { runner, background } = makeCommandRunner();
    const provider = new CommandSearchProvider(runner, identity);

    const [result] = await provider.search(parseQuery("$ notify-send oi"));
    await result?.activate();

    expect(result?.subtitle).toBe("Run in background");
    expect(background).toEqual(["notify-send oi"]);
  });

  test("comando vazio não gera resultado", async () => {
    const provider = new CommandSearchProvider(makeCommandRunner().runner, identity);

    expect(await provider.search(parseQuery(">  "))).toEqual([]);
  });

  test("não responde no modo padrão", () => {
    const provider = new CommandSearchProvider(makeCommandRunner().runner, identity);

    expect(provider.answers(parseQuery("htop").mode)).toBe(false);
  });
});

describe("SystemActionSearchProvider", () => {
  test("lista as ações que casam e ativa a escolhida", async () => {
    const { catalog, activated } = makeSystemActionCatalog([
      {
        id: "lock-screen",
        name: "Lock Screen",
        iconName: "system-lock-screen-symbolic",
        keywords: ["lock", "screen"],
      },
      {
        id: "suspend",
        name: "Suspend",
        iconName: "media-playback-pause-symbolic",
        keywords: ["suspend", "sleep"],
      },
    ]);
    const provider = new SystemActionSearchProvider(catalog);

    const results = await provider.search(parseQuery("sle"));
    await results[0]?.activate();

    expect(results.map((r) => r.title)).toEqual(["Suspend"]);
    expect(results[0]?.kind).toBe(ResultKind.SYSTEM);
    expect(activated).toEqual(["suspend"]);
  });

  test("ação que casa só por palavra-chave ainda tem nota mínima", async () => {
    const provider = new SystemActionSearchProvider(
      makeSystemActionCatalog([
        { id: "suspend", name: "Suspender", iconName: "x", keywords: ["sleep"] },
      ]).catalog,
    );

    const [result] = await provider.search(parseQuery("sleep"));

    expect(result?.score).toBeGreaterThanOrEqual(0.5);
  });
});

describe("WebSearchProvider", () => {
  const settings = { searchUrl: () => "https://duckduckgo.com/?q=%s" };

  test("`?` pesquisa com o termo codificado na URL", async () => {
    const { launcher, uris } = makeLauncher();
    const provider = new WebSearchProvider(launcher, settings, identity);

    const [result] = await provider.search(parseQuery("? gnome & shell"));
    await result?.activate();

    expect(result?.kind).toBe(ResultKind.WEB);
    expect(uris).toEqual(["https://duckduckgo.com/?q=gnome%20%26%20shell"]);
  });

  test("no modo padrão aparece como último recurso", async () => {
    const provider = new WebSearchProvider(makeLauncher().launcher, settings, identity);

    const [result] = await provider.search(parseQuery("algo"));

    expect(result?.score).toBeLessThan(0.1);
    expect(result?.title).toBe("Search the web for “algo”");
  });

  test("termo vazio não gera resultado", async () => {
    const provider = new WebSearchProvider(makeLauncher().launcher, settings, identity);

    expect(await provider.search(parseQuery("?"))).toEqual([]);
  });
});

describe("FileSearchProvider", () => {
  const HOME = "/home/maria";
  const tree = {
    "/home/maria": [
      { name: "Documentos", isDirectory: true, icon: { name: "folder-symbolic" } },
      { name: "Downloads", isDirectory: true, icon: { name: "folder-symbolic" } },
      { name: "doc.txt", isDirectory: false, icon: { name: "text-x-generic-symbolic" } },
      { name: ".config", isDirectory: true, icon: { name: "folder-symbolic" } },
    ],
  };

  test("filtra pelo trecho, pastas primeiro, e completa com barra", async () => {
    const provider = new FileSearchProvider(
      makeDirectoryReader(tree).reader,
      makeLauncher().launcher,
      HOME,
    );

    const results = await provider.search(parseQuery("~/do"));

    expect(results.map((r) => r.title)).toEqual(["Documentos", "Downloads", "doc.txt"]);
    expect(results[0]?.kind).toBe(ResultKind.FOLDER);
    expect(results[0]?.completion).toBe("~/Documentos/");
    expect(results[2]?.completion).toBe("~/doc.txt");
    expect(results[2]?.subtitle).toBe("~/doc.txt");
  });

  test("oculta arquivos escondidos, a menos que o trecho comece com ponto", async () => {
    const provider = new FileSearchProvider(
      makeDirectoryReader(tree).reader,
      makeLauncher().launcher,
      HOME,
    );

    const all = await provider.search(parseQuery("~/"));
    const hidden = await provider.search(parseQuery("~/.co"));

    expect(all.map((r) => r.title)).not.toContain(".config");
    expect(hidden.map((r) => r.title)).toEqual([".config"]);
  });

  test("ativar abre o caminho completo", async () => {
    const { launcher, paths } = makeLauncher();
    const provider = new FileSearchProvider(makeDirectoryReader(tree).reader, launcher, HOME);

    const [result] = await provider.search(parseQuery("~/doc.t"));
    await result?.activate();

    expect(paths).toEqual(["/home/maria/doc.txt"]);
  });

  test("pasta inexistente não quebra a busca", async () => {
    const provider = new FileSearchProvider(
      makeDirectoryReader(tree).reader,
      makeLauncher().launcher,
      HOME,
    );

    expect(await provider.search(parseQuery("/nao/existe/x"))).toEqual([]);
  });
});
