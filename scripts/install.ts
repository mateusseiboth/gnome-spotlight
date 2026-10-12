/**
 * Instala o `dist/` em ~/.local/share/gnome-shell/extensions/<uuid>. No Wayland o Shell só
 * carrega extensão nova (ou código novo) depois de sair e entrar na sessão.
 */
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

if (!existsSync(join(DIST, "metadata.json"))) throw new Error("Rode `bun run build` antes.");

const { uuid } = JSON.parse(readFileSync(join(DIST, "metadata.json"), "utf8")) as { uuid: string };
const target = join(
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
  "gnome-shell/extensions",
  uuid,
);

rmSync(target, { recursive: true, force: true });
cpSync(DIST, target, { recursive: true });
console.log(`Instalada em ${target}`);
