/**
 * Coordinate conversion between internal SVG space and user-facing origin-relative space.
 *
 * Internally, items are stored with (x, y) = top-left corner in SVG space
 * where (0,0) = top-left of the plot.
 *
 * The user sees coordinates relative to the selected origin corner:
 *   Origin A (top-left)    → reference corner = item top-left
 *   Origin B (top-right)   → reference corner = item top-right
 *   Origin C (bottom-right)→ reference corner = item bottom-right
 *   Origin D (bottom-left) → reference corner = item bottom-left
 *
 * (X,Y) = (0,0) always means the reference corner is exactly at the origin corner.
 * X grows along the plot width away from the origin.
 * Y grows along the plot height away from the origin.
 */

import { Plot } from '@/types';

export interface DisplayCoords { x: number; y: number }

/** SVG (top-left) → user-visible display coords */
export function svgToDisplay(
  svgX: number,
  svgY: number,
  itemW: number,
  itemH: number,
  plot: Plot,
): DisplayCoords {
  switch (plot.origin) {
    case 'A': return { x: svgX,                  y: svgY };
    case 'B': return { x: plot.width  - (svgX + itemW), y: svgY };
    case 'C': return { x: plot.width  - (svgX + itemW), y: plot.height - (svgY + itemH) };
    case 'D': return { x: svgX,                  y: plot.height - (svgY + itemH) };
  }
}

/** User-entered display coords → SVG (top-left) */
export function displayToSvg(
  dx: number,
  dy: number,
  itemW: number,
  itemH: number,
  plot: Plot,
): DisplayCoords {
  switch (plot.origin) {
    case 'A': return { x: dx,                        y: dy };
    case 'B': return { x: plot.width  - dx - itemW,  y: dy };
    case 'C': return { x: plot.width  - dx - itemW,  y: plot.height - dy - itemH };
    case 'D': return { x: dx,                        y: plot.height - dy - itemH };
  }
}

/** Max valid display coord for an item (so it stays inside the plot) */
export function maxDisplay(itemW: number, itemH: number, plot: Plot) {
  return { x: plot.width - itemW, y: plot.height - itemH };
}
