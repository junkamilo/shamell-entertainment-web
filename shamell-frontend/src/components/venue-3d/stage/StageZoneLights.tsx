"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, type SpotLight } from "three";
import { STAGE_COLORS } from "./stageMaterials";
import {
  STAGE_DEPTH,
  STAGE_TOP_Y,
  STAGE_WIDTH,
  ZONE_SPOT_DISTANCE,
  ZONE_SPOT_FORWARD_OFFSET,
  ZONE_SPOT_HEIGHT_OFFSET,
  ZONE_SPOT_INTENSITY,
  ZONE_STAIR_LIGHT_INTENSITY,
  ZONE_STAIR_POINT_Y_OFFSET,
  ZONE_STAIR_POINT_Z_OFFSET,
} from "./stageConstants";

export default function StageZoneLights() {
  const spotRef = useRef<SpotLight>(null);
  const target = useMemo(() => {
    const t = new Object3D();
    t.position.set(STAGE_WIDTH / 2, STAGE_TOP_Y, STAGE_DEPTH / 2);
    return t;
  }, []);

  useLayoutEffect(() => {
    const spot = spotRef.current;
    if (!spot) return;
    spot.target = target;
  }, [target]);

  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={spotRef}
        position={[
          STAGE_WIDTH / 2,
          STAGE_TOP_Y + ZONE_SPOT_HEIGHT_OFFSET,
          STAGE_DEPTH + ZONE_SPOT_FORWARD_OFFSET,
        ]}
        angle={0.52}
        penumbra={0.7}
        intensity={ZONE_SPOT_INTENSITY}
        color={STAGE_COLORS.marqueeBulb}
        distance={ZONE_SPOT_DISTANCE}
      />
      <pointLight
        position={[
          STAGE_WIDTH / 2,
          STAGE_TOP_Y + ZONE_STAIR_POINT_Y_OFFSET,
          STAGE_DEPTH + ZONE_STAIR_POINT_Z_OFFSET,
        ]}
        intensity={ZONE_STAIR_LIGHT_INTENSITY}
        color={STAGE_COLORS.marqueeBulb}
        distance={5}
      />
    </group>
  );
}
