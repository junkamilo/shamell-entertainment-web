"use client";

import { STAGE_COLORS } from "./stageMaterials";
import { BACKDROP_HEIGHT, STAGE_WIDTH } from "./stageConstants";
import StageBackdropSignage from "./StageBackdropSignage";

export default function StageBackdrop() {
  return (
    <group position={[STAGE_WIDTH / 2, BACKDROP_HEIGHT / 2, -0.06]}>
      <mesh receiveShadow>
        <boxGeometry args={[STAGE_WIDTH + 0.4, BACKDROP_HEIGHT, 0.12]} />
        <meshStandardMaterial color={STAGE_COLORS.backdrop} roughness={0.95} />
      </mesh>
      <StageBackdropSignage />
    </group>
  );
}
