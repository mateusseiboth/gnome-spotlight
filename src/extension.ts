/**
 * Ponto de entrada da extensão. Só liga e desliga a sessão; toda a montagem está em
 * `SpotlightSession`.
 */
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { SpotlightSession } from "@app/spotlightSession";

export default class GnomeSpotlightExtension extends Extension {
  private session: SpotlightSession | null = null;

  override enable(): void {
    // O gettext da instância usa o domínio do metadata sem depender da pilha de chamadas.
    this.session = new SpotlightSession(this.getSettings(), (message) => this.gettext(message));
    this.session.start();
  }

  override disable(): void {
    this.session?.stop();
    this.session = null;
  }
}
