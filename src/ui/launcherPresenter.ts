import type { SearchResult } from "@domain/search/searchResult";
import { LatestRequestGate } from "@domain/selection/latestRequestGate";
import { SelectionCursor } from "@domain/selection/selectionCursor";

export interface LauncherView {
  renderResults(results: readonly SearchResult[], selectedIndex: number): void;
  renderSelection(selectedIndex: number): void;
  setQueryText(text: string): void;
  close(): void;
}

export type SearchFunction = (raw: string) => Promise<readonly SearchResult[]>;
export type ErrorListener = (error: unknown) => void;

export class LauncherPresenter {
  private results: readonly SearchResult[] = [];
  private readonly cursor = new SelectionCursor();
  private readonly gate = new LatestRequestGate();

  constructor(
    private readonly search: SearchFunction,
    private readonly view: LauncherView,
    private readonly onError: ErrorListener = () => {},
  ) {}

  async onQueryChanged(text: string): Promise<void> {
    const token = this.gate.next();
    const results = await this.searchSafely(text);
    if (!this.gate.isCurrent(token)) return;

    this.show(results);
  }

  onMoveSelection(delta: number): void {
    this.cursor.move(delta);
    this.view.renderSelection(this.cursor.index);
  }

  async onActivateSelected(): Promise<void> {
    await this.onActivateAt(this.cursor.index);
  }

  async onActivateAt(index: number): Promise<void> {
    const selected = this.results[index];
    if (!selected) return;

    this.view.close();
    try {
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

  private async searchSafely(text: string): Promise<readonly SearchResult[]> {
    try {
      return await this.search(text);
    } catch (error) {
      this.onError(error);
      return [];
    }
  }

  private show(results: readonly SearchResult[]): void {
    this.results = results;
    this.cursor.reset(results.length);
    this.view.renderResults(results, this.cursor.index);
  }
}
