/**
 * Detecta o Blur my Shell. Ele se registra em `global.blur_my_shell` no `enable()` e, com o
 * componente de popups ligado, desfoca (com cantos arredondados) os atores com classe de
 * diálogo que aparecem no `modalDialogGroup`, como o painel da busca.
 */
export const hasBlurMyShell = (): boolean =>
  (global as unknown as Record<string, unknown>).blur_my_shell !== undefined;
