export type Translate = (message: string) => string;

export const formatMessage = (template: string, ...args: readonly string[]): string => {
  let next = 0;
  return template.replace(/%s/g, () => args[next++] ?? "");
};
