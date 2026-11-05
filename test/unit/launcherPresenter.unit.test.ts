/**
 * Comportamento da janela de busca sem St: digitar, navegar com as setas, ativar com
 * Enter ou clique, completar com Tab e descartar resposta atrasada. View falsa.
 */
import { describe, expect, test } from "bun:test";

import { ResultKind, type SearchResult } from "@domain/search/searchResult";
import { SpotlightPresenter, type SpotlightView } from "@ui/spotlightPresenter";

const result = (
  id: string,
  overrides: Partial<SearchResult> = {},
): SearchResult & { activated: number } => {
  const item = {
    id,
    title: id,
    kind: ResultKind.APP,
    icon: { name: "x" },
    score: 1,
    activated: 0,
    activate() {
      item.activated += 1;
    },
    ...overrides,
  };
  return item;
};

const makeView = () => {
  const calls: string[] = [];
  const state = { results: [] as readonly SearchResult[], selected: -1, text: "", closed: 0 };
  const view: SpotlightView = {
    renderResults: (results, selected) => {
      state.results = results;
      state.selected = selected;
      calls.push("render");
    },
    renderSelection: (selected) => {
      state.selected = selected;
    },
    setQueryText: (text) => {
      state.text = text;
    },
    close: () => {
      state.closed += 1;
      calls.push("close");
    },
  };
  return { view, state, calls };
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

describe("SpotlightPresenter", () => {
  test("digitar mostra os resultados com o primeiro selecionado", async () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(async () => [result("a"), result("b")], view);

    await presenter.onQueryChanged("x");

    expect(state.results.map((r) => r.id)).toEqual(["a", "b"]);
    expect(state.selected).toBe(0);
  });

  test("setas movem a seleção e dão a volta", async () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(async () => [result("a"), result("b")], view);
    await presenter.onQueryChanged("x");

    presenter.onMoveSelection(1);
    expect(state.selected).toBe(1);

    presenter.onMoveSelection(1);
    expect(state.selected).toBe(0);
  });

  test("Enter fecha a janela ANTES de ativar o selecionado", async () => {
    const { view, calls } = makeView();
    const second = result("b", {
      activate: () => {
        calls.push("activate");
      },
    });
    const presenter = new SpotlightPresenter(async () => [result("a"), second], view);
    await presenter.onQueryChanged("x");
    presenter.onMoveSelection(1);

    await presenter.onActivateSelected();

    expect(calls.slice(-2)).toEqual(["close", "activate"]);
  });

  test("clique ativa a linha clicada", async () => {
    const { view } = makeView();
    const items = [result("a"), result("b")];
    const presenter = new SpotlightPresenter(async () => items, view);
    await presenter.onQueryChanged("x");

    await presenter.onActivateAt(1);

    expect(items[1]?.activated).toBe(1);
    expect(items[0]?.activated).toBe(0);
  });

  test("Enter sem resultado não fecha nem quebra", async () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(async () => [], view);
    await presenter.onQueryChanged("x");

    await presenter.onActivateSelected();

    expect(state.closed).toBe(0);
  });

  test("Tab completa com o texto do resultado selecionado", async () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(
      async () => [result("pasta", { completion: "~/Documentos/" })],
      view,
    );
    await presenter.onQueryChanged("~/Doc");

    presenter.onComplete();

    expect(state.text).toBe("~/Documentos/");
  });

  test("Tab sem completar disponível não mexe no texto", async () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(async () => [result("app")], view);
    await presenter.onQueryChanged("fire");

    presenter.onComplete();

    expect(state.text).toBe("");
  });

  test("resposta atrasada de uma digitação antiga é descartada", async () => {
    const { view, state } = makeView();
    const slow = deferred<SearchResult[]>();
    const responses: Record<string, Promise<SearchResult[]>> = {
      "~/D": slow.promise,
      "~/Do": Promise.resolve([result("novo")]),
    };
    const presenter = new SpotlightPresenter((raw) => responses[raw]!, view);

    const first = presenter.onQueryChanged("~/D");
    await presenter.onQueryChanged("~/Do");
    slow.resolve([result("velho")]);
    await first;

    expect(state.results.map((r) => r.id)).toEqual(["novo"]);
  });

  test("reset limpa a lista e invalida buscas em andamento", async () => {
    const { view, state } = makeView();
    const slow = deferred<SearchResult[]>();
    const presenter = new SpotlightPresenter(() => slow.promise, view);

    const pending = presenter.onQueryChanged("x");
    presenter.reset();
    slow.resolve([result("tarde")]);
    await pending;

    expect(state.results).toEqual([]);
  });

  test("erro na ativação vai para o tratador, sem estourar", async () => {
    const { view } = makeView();
    const errors: unknown[] = [];
    const failing = result("a", {
      activate: () => {
        throw new Error("sem terminal");
      },
    });
    const presenter = new SpotlightPresenter(
      async () => [failing],
      view,
      (error) => errors.push(error),
    );
    await presenter.onQueryChanged("x");

    await presenter.onActivateSelected();

    expect(errors).toHaveLength(1);
  });

  test("erro na busca limpa a lista e vai para o tratador", async () => {
    const { view, state } = makeView();
    const errors: unknown[] = [];
    const presenter = new SpotlightPresenter(
      async () => {
        throw new Error("falhou");
      },
      view,
      (error) => errors.push(error),
    );

    await presenter.onQueryChanged("x");

    expect(state.results).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  test("Esc com texto limpa a busca e mantém a janela aberta", () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(async () => [], view);
    state.text = "fire";

    presenter.onEscape("fire");

    expect(state.text).toBe("");
    expect(state.closed).toBe(0);
  });

  test("Esc sem texto fecha a janela", () => {
    const { view, state } = makeView();
    const presenter = new SpotlightPresenter(async () => [], view);

    presenter.onEscape("");

    expect(state.closed).toBe(1);
  });
});
