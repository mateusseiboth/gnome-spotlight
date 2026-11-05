import * as SystemActions from "resource:///org/gnome/shell/misc/systemActions.js";

import type { SystemActionCatalog, SystemActionEntry } from "@domain/system/systemActionPorts";

interface ShellSystemActions {
  getMatchingActions(terms: string[]): string[];
  getName(id: string): string;
  getIconName(id: string): string;
  activateAction(id: string): void;
}

const tokenize = (term: string): string[] => term.toLowerCase().split(/\s+/).filter(Boolean);

export class ShellSystemActionCatalog implements SystemActionCatalog {
  private readonly actions = SystemActions.getDefault() as unknown as ShellSystemActions;

  findMatching(term: string): readonly SystemActionEntry[] {
    return this.actions.getMatchingActions(tokenize(term)).map((id) => ({
      id,
      name: this.actions.getName(id),
      iconName: this.actions.getIconName(id),
    }));
  }

  activate(id: string): void {
    this.actions.activateAction(id);
  }
}
