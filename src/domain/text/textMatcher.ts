/**
 * Pontuação de correspondência entre o termo digitado e um texto candidato.
 *
 * As regras formam uma cadeia ordenada (strategy): a primeira que casa decide a nota.
 * Nota 0 = não casa; 1 = igual. Tudo é comparado sem acento e sem caixa.
 */

export interface WeightedField {
  readonly value: string | undefined;
  readonly weight: number;
}

interface MatchContext {
  readonly term: string;
  readonly candidate: string;
  readonly words: readonly string[];
}

type MatchRule = (context: MatchContext) => number;

const DIACRITICS = /[̀-ͯ]/g;
const WORD_SEPARATORS = /[\s\-_.;,/()]+/;

export const normalizeText = (text: string): string =>
  text.normalize("NFD").replace(DIACRITICS, "").toLowerCase().replace(/\s+/g, " ").trim();

const splitWords = (text: string): string[] => text.split(WORD_SEPARATORS).filter(Boolean);

/** Bônus de até `range` proporcional a quanto do candidato o termo cobre. */
const coverageBonus = (context: MatchContext, range: number): number =>
  range * (context.term.length / context.candidate.length);

const matchExact: MatchRule = ({ term, candidate }) => (term === candidate ? 1 : 0);

const matchPrefix: MatchRule = (context) =>
  context.candidate.startsWith(context.term) ? 0.85 + coverageBonus(context, 0.1) : 0;

const matchWordPrefix: MatchRule = (context) =>
  context.words.some((word) => word.startsWith(context.term))
    ? 0.7 + coverageBonus(context, 0.1)
    : 0;

/** Termo com várias palavras: cada uma precisa começar alguma palavra do candidato. */
const matchAllWords: MatchRule = ({ term, words }) => {
  const parts = term.split(" ");
  if (parts.length < 2) return 0;

  const isEveryPartFound = parts.every((part) => words.some((word) => word.startsWith(part)));
  return isEveryPartFound ? 0.65 : 0;
};

const matchSubstring: MatchRule = (context) =>
  context.candidate.includes(context.term) ? 0.5 + coverageBonus(context, 0.1) : 0;

const matchAcronym: MatchRule = ({ term, words }) => {
  if (words.length < 2) return 0;

  const initials = words.map((word) => word[0]).join("");
  return initials.startsWith(term) ? 0.45 : 0;
};

/** Letras do termo aparecem em ordem no candidato; quanto mais juntas, maior a nota. */
const matchSubsequence: MatchRule = ({ term, candidate }) => {
  let position = -1;
  let first = -1;

  for (const char of term) {
    position = candidate.indexOf(char, position + 1);
    if (position < 0) return 0;
    if (first < 0) first = position;
  }

  const span = position - first + 1;
  return 0.3 * (term.length / span);
};

const MATCH_RULES: readonly MatchRule[] = [
  matchExact,
  matchPrefix,
  matchWordPrefix,
  matchAllWords,
  matchSubstring,
  matchAcronym,
  matchSubsequence,
];

export const scoreMatch = (rawTerm: string, rawCandidate: string): number => {
  const term = normalizeText(rawTerm);
  const candidate = normalizeText(rawCandidate);
  if (!term || !candidate) return 0;

  const context: MatchContext = { term, candidate, words: splitWords(candidate) };

  for (const rule of MATCH_RULES) {
    const score = rule(context);
    if (score > 0) return Math.min(score, 1);
  }

  return 0;
};

export const scoreBestField = (term: string, fields: readonly WeightedField[]): number =>
  fields.reduce((best, { value, weight }) => {
    if (!value) return best;
    return Math.max(best, scoreMatch(term, value) * weight);
  }, 0);
