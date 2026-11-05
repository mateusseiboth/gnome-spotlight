import Clutter from "gi://Clutter";
import Shell from "gi://Shell";
import St from "gi://St";
import { ensureActorVisibleInScrollView } from "resource:///org/gnome/shell/misc/animationUtils.js";
import { MonitorConstraint } from "resource:///org/gnome/shell/ui/layout.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { PanelSurface, resolvePanelSurface } from "@domain/appearance/panelSurface";
import { getResultKindLabel } from "@domain/search/resultKindLabel";
import type { SearchResult } from "@domain/search/searchResult";
import type { Translate } from "@i18n/translate";
import { hasBlurMyShell } from "@infra/gnome/blurProvider";
import type { LauncherPresenter, LauncherView } from "@ui/launcherPresenter";
import { ResultRow } from "@ui/resultRow";

export type LauncherListener = Pick<
  LauncherPresenter,
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
const BLUR_TARGET_CLASS = "clipboard-dialog";
const ENTRY_INLINE_STYLE = "background-color: transparent; box-shadow: none; border: none;";

const PANEL_SURFACE_CLASSES: Record<PanelSurface, string> = {
  [PanelSurface.GLASS]: "launcher-panel-glass",
  [PanelSurface.SOLID]: "launcher-panel-solid",
};

type KeyAction = (listener: LauncherListener, text: string) => void;

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

export class LauncherOverlay implements LauncherView {
  private readonly backdrop: St.Widget;
  private readonly monitorConstraint: MonitorConstraint;
  private readonly panel: St.BoxLayout;
  private readonly entry: St.Entry;
  private readonly separator: St.Widget;
  private readonly scrollView: St.ScrollView;
  private readonly resultsBox: St.BoxLayout;
  private rows: ResultRow[] = [];
  private grab: Clutter.Grab | null = null;
  private listener: LauncherListener | null = null;

  constructor(private readonly t: Translate) {
    this.entry = new St.Entry({
      style_class: "launcher-entry",
      hint_text: t("Search apps, windows, files or type a calculation"),
      can_focus: true,
      x_expand: true,
      primary_icon: new St.Icon({
        style_class: "launcher-entry-icon",
        icon_name: "edit-find-symbolic",
      }),
      style: ENTRY_INLINE_STYLE,
    });

    this.separator = new St.Widget({ style_class: "launcher-separator", visible: false });

    this.resultsBox = new St.BoxLayout({
      style_class: "launcher-results",
      orientation: Clutter.Orientation.VERTICAL,
      x_expand: true,
    });
    this.scrollView = new St.ScrollView({
      style_class: "launcher-scroll",
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
      overlay_scrollbars: true,
      child: this.resultsBox,
      visible: false,
    });

    this.panel = new St.BoxLayout({
      style_class: `launcher-panel ${BLUR_TARGET_CLASS}`,
      orientation: Clutter.Orientation.VERTICAL,
      reactive: true,
    });
    this.panel.add_child(this.entry);
    this.panel.add_child(this.separator);
    this.panel.add_child(this.scrollView);

    this.backdrop = new St.Widget({ reactive: true });
    this.monitorConstraint = new MonitorConstraint({});
    this.backdrop.add_constraint(this.monitorConstraint);
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

  attach(listener: LauncherListener): void {
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

    this.monitorConstraint.index = monitor.index;
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
