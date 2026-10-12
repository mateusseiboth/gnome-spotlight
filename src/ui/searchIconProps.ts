/**
 * Converte o ícone do domínio nas propriedades do `St.Icon`.
 */
import type Gio from "gi://Gio";

import type { SearchIcon } from "@domain/search/searchResult";

export type IconProps = { gicon: Gio.Icon } | { icon_name: string };

export const toIconProps = (icon: SearchIcon): IconProps =>
  "gicon" in icon ? { gicon: icon.gicon } : { icon_name: icon.name };
