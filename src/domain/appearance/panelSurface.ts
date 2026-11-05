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
