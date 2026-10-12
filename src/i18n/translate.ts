/**
 * Tradução injetada (DIP): o domínio recebe `Translate` e não sabe do gettext do Shell.
 * Em teste, passa a identidade.
 */

export type Translate = (message: string) => string;

export const formatMessage = (template: string, ...args: readonly string[]): string => {
  let next = 0;
  return template.replace(/%s/g, () => args[next++] ?? "");
};
