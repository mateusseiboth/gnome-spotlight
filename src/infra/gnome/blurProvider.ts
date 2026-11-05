export const hasBlurMyShell = (): boolean =>
  (global as unknown as Record<string, unknown>).blur_my_shell !== undefined;
