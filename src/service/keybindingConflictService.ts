/**
 * Libera, ao ativar a extensão, os atalhos do GNOME que brigam com o da busca, e devolve
 * exatamente o que tirou ao desativar.
 *
 * O registro do que foi tirado fica numa chave GSettings da própria extensão, e não em
 * memória: se o Shell cair com a extensão ativa, o próximo `disable()` ainda sabe o que
 * devolver.
 */
import type {
  KeybindingLocation,
  KeybindingStore,
  ReleasedBinding,
  ReleasedBindingStore,
} from "@domain/keybinding/keybindingPorts";

const isSameAccelerator = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase();

export class KeybindingConflictService {
  constructor(
    private readonly store: KeybindingStore,
    private readonly releasedStore: ReleasedBindingStore,
    private readonly candidates: readonly KeybindingLocation[],
  ) {}

  release(accelerators: readonly string[]): void {
    const released = [...this.readReleased()];

    for (const location of this.candidates) {
      released.push(...this.releaseFrom(location, accelerators));
    }

    this.releasedStore.write(JSON.stringify(released));
  }

  restore(): void {
    for (const binding of this.readReleased()) this.restoreBinding(binding);
    this.releasedStore.write("[]");
  }

  private releaseFrom(
    location: KeybindingLocation,
    accelerators: readonly string[],
  ): ReleasedBinding[] {
    const current = this.store.read(location);
    const released = current
      .map((accelerator, index) => ({ ...location, accelerator, index }))
      .filter(({ accelerator }) =>
        accelerators.some((wanted) => isSameAccelerator(wanted, accelerator)),
      );

    if (released.length === 0) return [];

    this.store.write(
      location,
      current.filter(
        (accelerator) => !released.some((binding) => binding.accelerator === accelerator),
      ),
    );
    return released;
  }

  private restoreBinding(binding: ReleasedBinding): void {
    const current = this.store.read(binding);
    if (current.some((accelerator) => isSameAccelerator(accelerator, binding.accelerator))) return;

    const next = [...current];
    next.splice(Math.min(binding.index, next.length), 0, binding.accelerator);
    this.store.write(binding, next);
  }

  private readReleased(): readonly ReleasedBinding[] {
    try {
      const parsed: unknown = JSON.parse(this.releasedStore.read());
      return Array.isArray(parsed) ? (parsed as ReleasedBinding[]) : [];
    } catch {
      return [];
    }
  }
}
