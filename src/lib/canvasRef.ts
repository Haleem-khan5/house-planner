// Shared reference to the planner SVG element so any component can compute the
// current visible centre of the canvas without prop-drilling.
export const canvasElRef: { current: SVGSVGElement | null } = { current: null };

export const CANVAS_RULER = 52; // must match PlannerCanvas RULER constant

export function getVisibleCenter(
  panX: number,
  panY: number,
  scale: number,
  plotWidth: number,
  plotHeight: number,
): { x: number; y: number } {
  const el = canvasElRef.current;
  if (!el) return { x: plotWidth / 2, y: plotHeight / 2 };
  const { width: w, height: h } = el.getBoundingClientRect();
  const cx = (w / 2 - panX - CANVAS_RULER) / scale;
  const cy = (h / 2 - panY - CANVAS_RULER) / scale;
  return {
    x: Math.max(0, Math.min(plotWidth, cx)),
    y: Math.max(0, Math.min(plotHeight, cy)),
  };
}
