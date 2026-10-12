/**
 * Só a busca mais recente pode atualizar a lista: respostas atrasadas são descartadas.
 */
export class LatestRequestGate {
  private latest = 0;

  next(): number {
    this.latest += 1;
    return this.latest;
  }

  isCurrent(token: number): boolean {
    return token === this.latest;
  }

  invalidate(): void {
    this.latest += 1;
  }
}
