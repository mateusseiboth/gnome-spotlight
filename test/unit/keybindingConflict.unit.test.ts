/**
 * Super+Espaço já pertence ao "trocar fonte de entrada" do GNOME. O serviço libera o
 * atalho ao ativar e devolve exatamente o que tirou ao desativar.
 */
import { describe, expect, test } from "bun:test";

import type { KeybindingStore, ReleasedBindingStore } from "@domain/keybinding/keybindingPorts";
import { KeybindingConflictService } from "@service/keybindingConflictService";

const INPUT_SOURCE = { schema: "org.gnome.desktop.wm.keybindings", key: "switch-input-source" };

const makeService = (initial: Record<string, string[]>) => {
  const values = new Map(Object.entries(initial));
  let released = "[]";

  const store: KeybindingStore = {
    read: ({ schema, key }) => [...(values.get(`${schema}/${key}`) ?? [])],
    write: ({ schema, key }, accelerators) => values.set(`${schema}/${key}`, [...accelerators]),
  };
  const releasedStore: ReleasedBindingStore = {
    read: () => released,
    write: (value) => (released = value),
  };

  const service = new KeybindingConflictService(store, releasedStore, [INPUT_SOURCE]);
  const current = () => values.get(`${INPUT_SOURCE.schema}/${INPUT_SOURCE.key}`);

  return { service, current, released: () => released };
};

describe("KeybindingConflictService", () => {
  test("remove o atalho conflitante e guarda a posição original", () => {
    const { service, current, released } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["<Super>space", "XF86Keyboard"],
    });

    service.release(["<Super>space"]);

    expect(current()).toEqual(["XF86Keyboard"]);
    expect(JSON.parse(released())).toEqual([
      { ...INPUT_SOURCE, accelerator: "<Super>space", index: 0 },
    ]);
  });

  test("não mexe em nada quando não há conflito", () => {
    const { service, current, released } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["XF86Keyboard"],
    });

    service.release(["<Super>space"]);

    expect(current()).toEqual(["XF86Keyboard"]);
    expect(JSON.parse(released())).toEqual([]);
  });

  test("compara aceleradores sem diferenciar caixa", () => {
    const { service, current } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["<super>Space"],
    });

    service.release(["<Super>space"]);

    expect(current()).toEqual([]);
  });

  test("restaura na posição original e limpa o registro", () => {
    const { service, current, released } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["<Super>space", "XF86Keyboard"],
    });

    service.release(["<Super>space"]);
    service.restore();

    expect(current()).toEqual(["<Super>space", "XF86Keyboard"]);
    expect(JSON.parse(released())).toEqual([]);
  });

  test("não duplica se o usuário já devolveu o atalho por conta própria", () => {
    const { service, current } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["<Super>space"],
    });

    service.release(["<Super>space"]);
    service.restore();
    service.restore();

    expect(current()).toEqual(["<Super>space"]);
  });

  test("registro corrompido é tratado como vazio", () => {
    const { service, current, released } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["XF86Keyboard"],
    });

    service.restore();

    expect(current()).toEqual(["XF86Keyboard"]);
    expect(released()).toBe("[]");
  });

  test("liberar duas vezes não perde o registro da primeira", () => {
    const { service, current } = makeService({
      "org.gnome.desktop.wm.keybindings/switch-input-source": ["<Super>space", "XF86Keyboard"],
    });

    service.release(["<Super>space"]);
    service.release(["<Super>space"]);
    service.restore();

    expect(current()).toEqual(["<Super>space", "XF86Keyboard"]);
  });
});
