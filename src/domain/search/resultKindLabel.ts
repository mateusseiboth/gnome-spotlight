import { ResultKind, type SearchResult } from "@domain/search/searchResult";
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
  [ResultKind.BOOKMARK]: (t) => t("Bookmark"),
  [ResultKind.PROVIDER]: (t) => t("Search"),
};

export const getResultKindLabel = (kind: ResultKind, t: Translate): string => KIND_LABELS[kind](t);

export const getResultLabel = (result: SearchResult, t: Translate): string =>
  result.label ?? getResultKindLabel(result.kind, t);
