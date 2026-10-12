/**
 * Janela de busca em St. É a view do `SpotlightPresenter`: desenha o que ele manda e
 * repassa teclado e clique.
 *
 * Posição: centro horizontal do monitor em foco, topo a 25% da altura. A posição é
 * EXPLÍCITA (AlignConstraint + y): com `BinLayout` + `y_align: START` o Shell 50 ignorava o
 * alinhamento e centralizava o painel, empurrando-o para baixo do meio da tela.
 *
 * Blur: quem desfoca é o Blur my Shell, que já trata os cantos arredondados. O painel leva
 * a classe `clipboard-dialog` (uma das que ele reconhece em diálogos e que o tema do GNOME
 * não estiliza) e fica translúcido só quando o Blur my Shell está ativo. O
 * `Shell.BlurEffect` próprio foi descartado: sem raio de canto, ele deixava quinas
 * quadradas, e desfocar a tela inteira não é o efeito desejado.
 *
 * A caixa de busca usa estilo INLINE: o tema pinta `StEntry:focus` com fundo e anel
 * (`box-shadow ... !important`), e nenhuma regra da folha da extensão ganhou dele.
 */
import Clutter from "gi://Clutter";
import Shell from "gi://Shell";
import St from "gi://St";
import { ensureActorVisibleInScrollView } from "resource:///org/gnome/shell/misc/animationUtils.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { PanelSurface, resolvePanelSurface } from "@domain/appearance/panelSurface";
import { getResultKindLabel } from "@domain/search/resultKindLabel";
import type { SearchResult } from "@domain/search/searchResult";
import type { Translate } from "@i18n/translate";
import { hasBlurMyShell } from "@infra/gnome/blurProvider";
import { ResultRow } from "@ui/resultRow";
import type { SpotlightPresenter, SpotlightView } from "@ui/spotlightPresenter";

export type SpotlightListener = Pick<
  SpotlightPresenter,
  | "onQueryChanged"
  | "onMoveSelection"
  | "onActivateSelected"
  | "onActivateAt"
  | "onComplete"
  | "onEscape"
  | "reset"
>;

const TOP_OFFSET_RATIO = 0.25;
const OPEN_ANIMATION_MS = 140;
/** Classe que o Blur my Shell reconhece como diálogo a desfocar. */
const BLUR_TARGET_CLASS = "clipboard-dialog";
const ENTRY_INLINE_STYLE = "background-color: transparent; box-shadow: none; border: none;";

const PANEL_SURFACE_CLASSES: Record<PanelSurface, string> = {
  [PanelSurface.GLASS]: "spotlight-panel-glass",
  [PanelSurface.SOLID]: "spotlight-panel-solid",
};

type KeyAction = (listener: SpotlightListener, text: string) => void;

/** Teclas tratadas na caixa de busca (strategy map por símbolo). */
const KEY_ACTIONS = new Map<number, KeyAction>([
  [Clutter.KEY_Escape, (listener, text) => listener.onEscape(text)],
  [Clutter.KEY_Up, (listener) => listener.onMoveSelection(-1)],
  [Clutter.KEY_KP_Up, (listener) => listener.onMoveSelection(-1)],
  [Clutter.KEY_Down, (listener) => listener.onMoveSelection(1)],
  [Clutter.KEY_KP_Down, (listener) => listener.onMoveSelection(1)],
  [Clutter.KEY_Return, (listener) => void listener.onActivateSelected()],
  [Clutter.KEY_KP_Enter, (listener) => void listener.onActivateSelected()],
  [Clutter.KEY_ISO_Enter, (listener) => void listener.onActivateSelected()],
  [Clutter.KEY_Tab, (listener) => listener.onComplete()],
]);

export class SpotlightOverlay implements SpotlightView {
  private readonly backdrop: St.Widget;
  private readonly panel: St.BoxLayout;
  private readonly entry: St.Entry;
  private readonly separator: St.Widget;
  private readonly scrollView: St.ScrollView;
  private readonly resultsBox: St.BoxLayout;
  private rows: ResultRow[] = [];
  private grab: Clutter.Grab | null = null;
  private listener: SpotlightListener | null = null;

  constructor(private readonly t: Translate) {
    this.entry = new St.Entry({
      style_class: "spotlight-entry",
      hint_text: t("Search apps, windows, files or type a calculation"),
      can_focus: true,
      x_expand: true,
      primary_icon: new St.Icon({
        style_class: "spotlight-entry-icon",
        icon_name: "edit-find-symbolic",
      }),
      style: ENTRY_INLINE_STYLE,
    });

    this.separator = new St.Widget({ style_class: "spotlight-separator", visible: false });

    this.resultsBox = new St.BoxLayout({
      style_class: "spotlight-results",
      orientation: Clutter.Orientation.VERTICAL,
      x_expand: true,
    });
    this.scrollView = new St.ScrollView({
      style_class: "spotlight-scroll",
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
      overlay_scrollbars: true,
      child: this.resultsBox,
      visible: false,
    });

    this.panel = new St.BoxLayout({
      style_class: `spotlight-panel ${BLUR_TARGET_CLASS}`,
      orientation: Clutter.Orientation.VERTICAL,
      reactive: true,
    });
    this.panel.add_child(this.entry);
    this.panel.add_child(this.separator);
    this.panel.add_child(this.scrollView);

    this.backdrop = new St.Widget({ reactive: true });
    this.backdrop.add_child(this.panel);
    this.panel.add_constraint(
      new Clutter.AlignConstraint({
        source: this.backdrop,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor: 0.5,
      }),
    );

    this.connectSignals();
  }

  attach(listener: SpotlightListener): void {
    this.listener = listener;
  }

  get isOpen(): boolean {
    return this.grab !== null;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open();
  }

  open(): void {
    if (this.isOpen) return;
    if (Main.overview.visible) Main.overview.hide();

    this.placeOnCurrentMonitor();
    this.applyPanelSurface();
    Main.layoutManager.modalDialogGroup.add_child(this.backdrop);

    this.grab = Main.pushModal(this.backdrop, { actionMode: Shell.ActionMode.SYSTEM_MODAL });
    this.entry.set_text("");
    this.listener?.reset();
    this.entry.grab_key_focus();
    this.animateIn();
  }

  close(): void {
    if (!this.grab) return;

    Main.popModal(this.grab);
    this.grab = null;
    this.backdrop.get_parent()?.remove_child(this.backdrop);
  }

  destroy(): void {
    this.close();
    this.backdrop.destroy();
  }

  renderResults(results: readonly SearchResult[], selectedIndex: number): void {
    this.resultsBox.destroy_all_children();
    this.rows = results.map(
      (result, index) =>
        new ResultRow(
          result,
          getResultKindLabel(result.kind, this.t),
          () => void this.listener?.onActivateAt(index),
        ),
    );
    this.rows.forEach((row) => this.resultsBox.add_child(row.actor));

    const hasResults = results.length > 0;
    this.separator.visible = hasResults;
    this.scrollView.visible = hasResults;
    this.renderSelection(selectedIndex);
  }

  renderSelection(selectedIndex: number): void {
    this.rows.forEach((row, index) => row.setSelected(index === selectedIndex));

    const selected = this.rows[selectedIndex];
    if (selected) ensureActorVisibleInScrollView(this.scrollView, selected.actor);
  }

  setQueryText(text: string): void {
    this.entry.set_text(text);
    this.entry.clutter_text.set_cursor_position(-1);
  }

  private connectSignals(): void {
    this.entry.clutter_text.connect(
      "text-changed",
      () => void this.listener?.onQueryChanged(this.entry.get_text()),
    );
    this.entry.clutter_text.connect("key-press-event", (_actor, event: Clutter.Event) =>
      this.onKeyPress(event.get_key_symbol()),
    );
    this.backdrop.connect("button-press-event", (_actor, event: Clutter.Event) =>
      this.onBackdropPress(event),
    );
  }

  private onKeyPress(symbol: number): boolean {
    const action = KEY_ACTIONS.get(symbol);
    if (!action || !this.listener) return Clutter.EVENT_PROPAGATE;

    action(this.listener, this.entry.get_text());
    return Clutter.EVENT_STOP;
  }

  /** Clique fora do painel fecha, como qualquer popover do GNOME. */
  private onBackdropPress(event: Clutter.Event): boolean {
    const target = global.stage.get_event_actor(event);
    if (target && this.panel.contains(target)) return Clutter.EVENT_PROPAGATE;

    this.close();
    return Clutter.EVENT_STOP;
  }

  private applyPanelSurface(): void {
    Object.values(PANEL_SURFACE_CLASSES).forEach((name) =>
      this.panel.remove_style_class_name(name),
    );
    this.panel.add_style_class_name(
      PANEL_SURFACE_CLASSES[resolvePanelSurface({ hasBlurProvider: hasBlurMyShell() })],
    );
  }

  private placeOnCurrentMonitor(): void {
    const monitor = Main.layoutManager.currentMonitor;
    if (!monitor) return;

    this.backdrop.set_position(monitor.x, monitor.y);
    this.backdrop.set_size(monitor.width, monitor.height);
    this.panel.y = Math.round(monitor.height * TOP_OFFSET_RATIO);
  }

  private animateIn(): void {
    this.panel.set_pivot_point(0.5, 0);
    this.panel.set({ opacity: 0, scaleX: 0.97, scaleY: 0.97 });
    this.panel.ease({
      opacity: 255,
      scaleX: 1,
      scaleY: 1,
      duration: OPEN_ANIMATION_MS,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });
  }
}
