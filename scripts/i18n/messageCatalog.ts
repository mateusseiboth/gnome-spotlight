/**
 * Fonte única da extração de mensagens traduzíveis: usada pelo teste de cobertura do
 * catálogo e pelo `scripts/extract-messages.ts`, que gera o `.pot`.
 *
 * Marcadores reconhecidos: `t("...")` (tradução injetada no domínio) e `_("...")`
 * (gettext do Shell na UI e nas preferências). SEMPRE com aspas duplas e texto literal:
 * mensagem montada por concatenação não é encontrada.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MESSAGE_CALL = /(?<!\w)(?:t|_)\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g;

const unescape = (text: string): string =>
  text.replace(/\\(.)/g, (_, char: string) => (char === "n" ? "\n" : char));

const listSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return path.endsWith(".ts") && !path.endsWith(".d.ts") ? [path] : [];
  });

export const extractMessages = (source: string): string[] =>
  [...source.matchAll(MESSAGE_CALL)].map((match) => unescape(match[1] ?? ""));

export const extractMessagesFromSources = (directory: string): Set<string> =>
  new Set(
    listSourceFiles(directory).flatMap((file) => extractMessages(readFileSync(file, "utf8"))),
  );

const readQuoted = (line: string): string =>
  unescape(line.slice(line.indexOf('"') + 1, line.lastIndexOf('"')));

/** Leitor mínimo de `.po`: msgid/msgstr simples e linhas continuadas. Sem plural. */
export const parsePoFile = (content: string): Map<string, string> => {
  const catalog = new Map<string, string>();
  let field: "msgid" | "msgstr" | null = null;
  let msgid = "";
  let msgstr = "";

  const flush = () => {
    if (msgid) catalog.set(msgid, msgstr);
    msgid = "";
    msgstr = "";
  };

  for (const line of content.split("\n")) {
    if (line.startsWith("msgid ")) {
      flush();
      field = "msgid";
      msgid = readQuoted(line);
      continue;
    }

    if (line.startsWith("msgstr ")) {
      field = "msgstr";
      msgstr = readQuoted(line);
      continue;
    }

    if (!line.startsWith('"') || !field) continue;

    const text = readQuoted(line);
    if (field === "msgid") msgid += text;
    if (field === "msgstr") msgstr += text;
  }

  flush();
  return catalog;
};

const escapePo = (text: string): string =>
  text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

export const buildPotFile = (messages: Iterable<string>, domain: string): string => {
  const header = [
    `# Mensagens traduzíveis de ${domain}.`,
    'msgid ""',
    'msgstr ""',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    "",
  ];
  const entries = [...messages]
    .sort()
    .flatMap((message) => [`msgid "${escapePo(message)}"`, 'msgstr ""', ""]);
  return [...header, ...entries].join("\n");
};
