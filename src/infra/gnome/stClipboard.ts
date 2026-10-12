/**
 * Área de transferência do Shell (Ctrl+V).
 */
import St from "gi://St";

import type { Clipboard } from "@domain/launcher/launcherPorts";

export class StClipboard implements Clipboard {
  setText(text: string): void {
    St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
  }
}
