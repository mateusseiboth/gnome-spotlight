/**
 * Apps instalados via `Shell.AppSystem`, com a frequência de uso do `Shell.AppUsage`.
 * A lista fica em cache e é refeita quando o Shell avisa `installed-changed`.
 */
import type GioUnix from "gi://GioUnix";
import Shell from "gi://Shell";

import type { AppCatalog, AppEntry } from "@domain/apps/appPorts";

type AppWithoutUsage = Omit<AppEntry, "usage">;

const toEntry = (info: GioUnix.DesktopAppInfo): AppWithoutUsage => ({
  id: info.get_id() ?? "",
  name: info.get_name(),
  genericName: info.get_generic_name() ?? undefined,
  description: info.get_description() ?? undefined,
  executable: info.get_executable() || undefined,
  keywords: info.get_keywords() ?? [],
  icon: info.get_icon() ? { gicon: info.get_icon()! } : { name: "application-x-executable" },
});

export class ShellAppCatalog implements AppCatalog {
  private readonly appSystem = Shell.AppSystem.get_default();
  private readonly usage = Shell.AppUsage.get_default();
  private cache: readonly AppWithoutUsage[] | null = null;
  private readonly installedChangedId: number;

  constructor() {
    this.installedChangedId = this.appSystem.connect(
      "installed-changed",
      () => (this.cache = null),
    );
  }

  list(): readonly AppEntry[] {
    const usage = this.buildUsageMap();
    return this.readInstalled().map((app) => ({ ...app, usage: usage.get(app.id) ?? 0 }));
  }

  launch(id: string): void {
    this.appSystem.lookup_app(id)?.activate();
  }

  destroy(): void {
    this.appSystem.disconnect(this.installedChangedId);
  }

  private readInstalled(): readonly AppWithoutUsage[] {
    this.cache ??= this.appSystem
      .get_installed()
      .filter((info) => info.should_show())
      .map((info) => toEntry(info as GioUnix.DesktopAppInfo))
      .filter((app) => app.id);
    return this.cache;
  }

  /** Posição na lista de mais usados vira nota de 1 (o primeiro) até perto de 0. */
  private buildUsageMap(): Map<string, number> {
    const mostUsed = this.usage.get_most_used();
    return new Map(mostUsed.map((app, index) => [app.get_id(), 1 - index / mostUsed.length]));
  }
}
