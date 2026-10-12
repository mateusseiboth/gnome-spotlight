/**
 * Fundo do painel da busca. O blur vem do Blur my Shell (ele desfoca atores de diálogo
 * com cantos arredondados); sem ele, painel translúcido mostraria as janelas nítidas por
 * trás, então o fundo fica sólido.
 */
export const PanelSurface = {
  GLASS: "glass",
  SOLID: "solid",
} as const;
export type PanelSurface = (typeof PanelSurface)[keyof typeof PanelSurface];

export interface PanelSurfaceInput {
  readonly hasBlurProvider: boolean;
}

export const resolvePanelSurface = ({ hasBlurProvider }: PanelSurfaceInput): PanelSurface =>
  hasBlurProvider ? PanelSurface.GLASS : PanelSurface.SOLID;
