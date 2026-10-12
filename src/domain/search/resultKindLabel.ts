/**
 * Rótulo à direita de cada resultado, um por tipo (strategy map).
 */
import { ResultKind } from "@domain/search/searchResult";
import type { Translate } from "@i18n/translate";

const KIND_LABELS: Record<ResultKind, (t: Translate) => string> = {
  [ResultKind.APP]: (t) => t("App"),
  [ResultKind.WINDOW]: (t) => t("Window"),
  [ResultKind.CALCULATOR]: (t) => t("Calculator"),
  [ResultKind.COMMAND]: (t) => t("Command"),
  [ResultKind.FILE]: (t) => t("File"),
  [ResultKind.FOLDER]: (t) => t("Folder"),
  [ResultKind.SYSTEM]: (t) => t("System"),
  [ResultKind.WEB]: (t) => t("Web"),
};

export const getResultKindLabel = (kind: ResultKind, t: Translate): string => KIND_LABELS[kind](t);
