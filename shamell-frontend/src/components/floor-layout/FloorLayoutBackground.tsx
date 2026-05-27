import { croquisImageRect } from "./floorLayoutCroquis";

type Props = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion?: string;
};

/** Reference croquis shipped as PNG (v1) for pixel-accurate venue walls. */
export default function FloorLayoutBackground({
  viewBoxWidth,
  viewBoxHeight,
  backgroundVersion = "v1",
}: Props) {
  const href =
    backgroundVersion === "v1"
      ? "/floor-layout/croquis-v1.png"
      : `/floor-layout/croquis-${backgroundVersion}.png`;

  const { x, y, width, height } = croquisImageRect(viewBoxWidth, viewBoxHeight);

  return (
    <image
      href={href}
      x={x}
      y={y}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
