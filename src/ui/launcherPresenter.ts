import type { SearchResult } from "@domain/search/searchResult";
import { LatestRequestGate } from "@domain/selection/latestRequestGate";
import { SelectionCursor } from "@domain/selection/selectionCursor";

export interface LauncherView {
  renderResults(results: readonly SearchResult[], selectedIndex: number): void;
  renderSelection(selectedIndex: number): void;
  setQueryText(text: string): void;
  close(): void;
}

export type ResultsListener = (results: readonly SearchResult[]) => void;
export type SearchFunction = (
  raw: string,
  onUpdate: ResultsListener,
) => Promise<readonly SearchResult[]>;
export type ErrorListener = (error: unknown) => void;

export class LauncherPresenter {
  private results: readonly SearchResult[] = [];
  private readonly cursor = new SelectionCursor();
  private readonly gate = new LatestRequestGate();
  private hasMovedSelection = false;

  constructor(
    private readonly search: SearchFunction,
    private readonly view: LauncherView,
    private readonly onError: ErrorListener = () => {},
  ) {}

  async onQueryChanged(text: string): Promise<void> {
    const token = this.gate.next();
    this.hasMovedSelection = false;
    const results = await this.searchSafely(text, (update) => {
      if (this.gate.isCurrent(token)) this.show(update);
    });
    if (!this.gate.isCurrent(token)) return;

    this.show(results);
  }

  onMoveSelection(delta: number): void {
    this.hasMovedSelection = true;
    this.cursor.move(delta);
    this.view.renderSelection(this.cursor.index);
  }

  async onActivateSelected(newWindow = false): Promise<void> {
    await this.onActivateAt(this.cursor.index, newWindow);
  }

  async onActivateAt(index: number, newWindow = false): Promise<void> {
    const selected = this.results[index];
    if (!selected) return;

    this.view.close();
    try {
      if (newWindow && selected.activateInNewWindow) {
        await selected.activateInNewWindow();
        return;
      }
      await selected.activate();
    } catch (error) {
      this.onError(error);
    }
  }

  onComplete(): void {
    const completion = this.results[this.cursor.index]?.completion;
    if (!completion) return;

    this.view.setQueryText(completion);
  }

  onEscape(currentText: string): void {
    if (currentText) {
      this.view.setQueryText("");
      return;
    }

    this.view.close();
  }

  reset(): void {
    this.gate.invalidate();
    this.show([]);
  }

  private async searchSafely(
    text: string,
    onUpdate: ResultsListener,
  ): Promise<readonly SearchResult[]> {
    try {
      return await this.search(text, onUpdate);
    } catch (error) {
      this.onError(error);
      return [];
    }
  }

  private show(results: readonly SearchResult[]): void {
    const selectedId = this.hasMovedSelection ? this.results[this.cursor.index]?.id : undefined;
    this.results = results;
    this.cursor.reset(results.length);
    this.cursor.select(results.findIndex((result) => result.id === selectedId));
    this.view.renderResults(results, this.cursor.index);
  }
}
