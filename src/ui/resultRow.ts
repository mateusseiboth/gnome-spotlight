/**
 * Uma linha da lista: ícone, título, subtítulo opcional e o tipo à direita.
 */
import Clutter from "gi://Clutter";
import Pango from "gi://Pango";
import St from "gi://St";

import type { SearchResult } from "@domain/search/searchResult";
import { toIconProps } from "@ui/searchIconProps";

const SELECTED = "selected";

const createEllipsizedLabel = (text: string, styleClass: string): St.Label => {
  const label = new St.Label({ text, style_class: styleClass, x_align: Clutter.ActorAlign.START });
  label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
  return label;
};

export class ResultRow {
  readonly actor: St.Button;

  constructor(result: SearchResult, kindLabel: string, onClick: () => void) {
    const texts = new St.BoxLayout({
      orientation: Clutter.Orientation.VERTICAL,
      x_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });
    texts.add_child(createEllipsizedLabel(result.title, "spotlight-result-title"));
    if (result.subtitle)
      texts.add_child(createEllipsizedLabel(result.subtitle, "spotlight-result-subtitle"));

    const row = new St.BoxLayout({ style_class: "spotlight-result-row", x_expand: true });
    row.add_child(
      new St.Icon({ style_class: "spotlight-result-icon", ...toIconProps(result.icon) }),
    );
    row.add_child(texts);
    row.add_child(
      new St.Label({
        text: kindLabel,
        style_class: "spotlight-result-kind",
        y_align: Clutter.ActorAlign.CENTER,
      }),
    );

    this.actor = new St.Button({
      style_class: "spotlight-result",
      child: row,
      x_expand: true,
      can_focus: false,
      accessible_name: result.title,
    });
    this.actor.connect("clicked", onClick);
  }

  setSelected(isSelected: boolean): void {
    if (isSelected) {
      this.actor.add_style_pseudo_class(SELECTED);
      return;
    }

    this.actor.remove_style_pseudo_class(SELECTED);
  }
}
