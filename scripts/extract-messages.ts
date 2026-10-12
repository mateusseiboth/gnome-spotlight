/**
 * Gera `po/gnome-spotlight.pot` a partir das mensagens marcadas no código. Depois de
 * rodar, atualize o `pt_BR.po` (o teste de catálogo aponta o que falta e o que sobrou).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildPotFile, extractMessagesFromSources } from "@scripts/i18n/messageCatalog";

const ROOT = join(import.meta.dir, "..");
const DOMAIN = "gnome-spotlight";

writeFileSync(
  join(ROOT, "po", `${DOMAIN}.pot`),
  buildPotFile(extractMessagesFromSources(join(ROOT, "src")), DOMAIN),
);
