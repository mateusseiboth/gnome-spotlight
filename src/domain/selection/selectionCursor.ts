/**
 * Linha selecionada na lista de resultados. Dá a volta nas pontas.
 */
export class SelectionCursor {
  private size = 0;
  private current = -1;

  get index(): number {
    return this.current;
  }

  reset(size: number): void {
    this.size = size;
    this.current = size > 0 ? 0 : -1;
  }

  move(delta: number): void {
    if (this.size === 0) return;
    this.current = (((this.current + delta) % this.size) + this.size) % this.size;
  }

  select(index: number): void {
    if (index < 0 || index >= this.size) return;
    this.current = index;
  }
}
