import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { $ } from "bun";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

if (!existsSync(join(DIST, "metadata.json"))) throw new Error("Rode `bun run build` antes.");

const { uuid } = JSON.parse(readFileSync(join(DIST, "metadata.json"), "utf8")) as { uuid: string };
const archive = join(ROOT, `${uuid}.shell-extension.zip`);

rmSync(archive, { force: true });
await $`zip -qr ${archive} . -x schemas/gschemas.compiled`.cwd(DIST);
console.log(`Pacote para o extensions.gnome.org: ${archive}`);
