/**
 * Regras da captura de atalho nas preferências. A primeira regra que se aplica decide
 * (cadeia de strategies). O nome da tecla é o do `Gdk.keyval_name`.
 */

export const ShortcutCapture = {
  /** Esc sozinho: desiste e mantém o atalho atual. */
  CANCEL: "cancel",
  /** Backspace sozinho: deixa a busca sem atalho. */
  CLEAR: "clear",
  /** Só modificadores até agora: continua esperando a tecla principal. */
  INCOMPLETE: "incomplete",
  /** Combinação que atrapalharia a digitação normal. */
  INVALID: "invalid",
  ACCEPT: "accept",
} as const;
export type ShortcutCapture = (typeof ShortcutCapture)[keyof typeof ShortcutCapture];

export interface ShortcutPress {
  readonly keyName: string;
  readonly hasSuper: boolean;
  readonly hasControl: boolean;
  readonly hasAlt: boolean;
  readonly hasShift: boolean;
}

type CaptureRule = (press: ShortcutPress) => ShortcutCapture | null;

const MODIFIER_KEY =
  /^(Super|Control|Alt|Shift|Meta|Hyper)_[LR]$|^ISO_Level\d_(Shift|Latch|Lock)$|^Caps_Lock$/;
const FUNCTION_KEY = /^F\d{1,2}$/;

/** Super, Ctrl e Alt "seguram" a tecla; Shift sozinho só muda a letra. */
const hasCommandModifier = (press: ShortcutPress): boolean =>
  press.hasSuper || press.hasControl || press.hasAlt;

const isBare = (press: ShortcutPress): boolean => !hasCommandModifier(press) && !press.hasShift;

const CAPTURE_RULES: readonly CaptureRule[] = [
  (press) => (MODIFIER_KEY.test(press.keyName) ? ShortcutCapture.INCOMPLETE : null),
  (press) => (isBare(press) && press.keyName === "Escape" ? ShortcutCapture.CANCEL : null),
  (press) => (isBare(press) && press.keyName === "BackSpace" ? ShortcutCapture.CLEAR : null),
  (press) => (FUNCTION_KEY.test(press.keyName) ? ShortcutCapture.ACCEPT : null),
  (press) => (hasCommandModifier(press) ? ShortcutCapture.ACCEPT : null),
];

export const classifyShortcutPress = (press: ShortcutPress): ShortcutCapture =>
  CAPTURE_RULES.reduce<ShortcutCapture | null>((decided, rule) => decided ?? rule(press), null) ??
  ShortcutCapture.INVALID;
