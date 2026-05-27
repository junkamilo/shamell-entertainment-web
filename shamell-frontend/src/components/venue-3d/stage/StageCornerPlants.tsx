"use client";

import StagePalmPlant from "./StagePalmPlant";
import { STAGE_DEPTH, STAGE_SCALE, STAGE_TOP_Y, STAGE_WIDTH } from "./stageConstants";

export default function StageCornerPlants() {
  const margin = 0.4 * STAGE_SCALE;
  const outerOffset = 0.95 * STAGE_SCALE;
  const frontPlantZ = 0.65 * STAGE_SCALE;
  const plantScaleInner = 0.6 * STAGE_SCALE;
  const plantScaleOuter = 0.68 * STAGE_SCALE;

  return (
    <group>
      <StagePalmPlant position={[margin, STAGE_TOP_Y, margin]} scale={plantScaleInner} />
      <StagePalmPlant
        position={[STAGE_WIDTH - margin, STAGE_TOP_Y, STAGE_DEPTH - margin]}
        scale={plantScaleInner}
        rotationY={Math.PI * 0.5}
      />
      <StagePalmPlant
        position={[-outerOffset, 0, STAGE_DEPTH + frontPlantZ]}
        scale={plantScaleOuter}
        rotationY={-0.55}
      />
      <StagePalmPlant
        position={[STAGE_WIDTH + outerOffset, 0, STAGE_DEPTH + frontPlantZ]}
        scale={plantScaleOuter}
        rotationY={0.55}
      />
    </group>
  );
}
