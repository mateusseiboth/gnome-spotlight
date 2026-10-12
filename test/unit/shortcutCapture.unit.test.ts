/**
 * Captura do atalho nas preferências: o que fazer com cada combinação pressionada.
 * Letra sem modificador não vale (sequestraria a digitação); tecla de função sozinha vale.
 */
import { describe, expect, test } from "bun:test";

import {
  classifyShortcutPress,
  ShortcutCapture,
  type ShortcutPress,
} from "@domain/keybinding/shortcutCapture";

const press = (
  keyName: string,
  modifiers: Partial<Omit<ShortcutPress, "keyName">> = {},
): ShortcutPress => ({
  keyName,
  hasSuper: false,
  hasControl: false,
  hasAlt: false,
  hasShift: false,
  ...modifiers,
});

describe("classifyShortcutPress", () => {
  test("Esc sozinho cancela a captura", () => {
    expect(classifyShortcutPress(press("Escape"))).toBe(ShortcutCapture.CANCEL);
  });

  test("Backspace sozinho desativa o atalho", () => {
    expect(classifyShortcutPress(press("BackSpace"))).toBe(ShortcutCapture.CLEAR);
  });

  test.each([["Super_L"], ["Control_R"], ["Alt_L"], ["Shift_L"], ["ISO_Level3_Shift"]])(
    "%p sozinho ainda está incompleto",
    (keyName) => {
      expect(classifyShortcutPress(press(keyName, { hasSuper: true }))).toBe(
        ShortcutCapture.INCOMPLETE,
      );
    },
  );

  test.each([["a"], ["space"], ["Return"]])("%p sem modificador é recusado", (keyName) => {
    expect(classifyShortcutPress(press(keyName))).toBe(ShortcutCapture.INVALID);
  });

  test("Shift sozinho com letra é recusado (é só uma maiúscula)", () => {
    expect(classifyShortcutPress(press("a", { hasShift: true }))).toBe(ShortcutCapture.INVALID);
  });

  test.each([
    [press("space", { hasSuper: true })],
    [press("k", { hasControl: true, hasAlt: true })],
    [press("Escape", { hasSuper: true })],
    [press("F12")],
    [press("F5", { hasShift: true })],
  ])("combinação válida é aceita", (input) => {
    expect(classifyShortcutPress(input)).toBe(ShortcutCapture.ACCEPT);
  });
});
