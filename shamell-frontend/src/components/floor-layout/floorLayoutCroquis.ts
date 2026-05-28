/** Zoom reference PNG inside the viewBox (reduces visible white margins in the asset). */
export const CROQUIS_IMAGE_SCALE = 1.14;

export function croquisImageRect(viewBoxWidth: number, viewBoxHeight: number) {
  const w = viewBoxWidth * CROQUIS_IMAGE_SCALE;
  const h = viewBoxHeight * CROQUIS_IMAGE_SCALE;
  return {
    x: (viewBoxWidth - w) / 2,
    y: (viewBoxHeight - h) / 2,
    width: w,
    height: h,
  };
}
