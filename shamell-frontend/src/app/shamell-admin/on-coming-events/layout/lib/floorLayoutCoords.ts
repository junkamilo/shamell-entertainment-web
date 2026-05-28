export function rectCenterToViewBox(
  svg: SVGSVGElement,
  viewBoxWidth: number,
  viewBoxHeight: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const pt = svg.createSVGPoint();
  pt.x = cx;
  pt.y = cy;
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: viewBoxWidth / 2, y: viewBoxHeight / 2 };
  }
  const local = pt.matrixTransform(ctm.inverse());
  const margin = 12;
  return {
    x: Math.min(viewBoxWidth - margin, Math.max(margin, local.x)),
    y: Math.min(viewBoxHeight - margin, Math.max(margin, local.y)),
  };
}
