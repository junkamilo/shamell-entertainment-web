"use client";

import { STAGE_COLORS, STAGE_MATERIAL } from "./stageMaterials";
import {
  STAGE_DEPTH,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  STAIR_COUNT,
  STAIR_DEPTH,
  STAIR_WIDTH,
} from "./stageConstants";

const NOSING_HEIGHT = STAGE_HEIGHT * 0.02;

export default function StageStairs() {
  const stepHeight = STAGE_HEIGHT / STAIR_COUNT;
  const centerX = STAGE_WIDTH / 2;

  return (
    <group>
      {Array.from({ length: STAIR_COUNT }, (_, i) => {
        const topY = STAGE_HEIGHT - i * stepHeight;
        const bottomY = topY - stepHeight;
        const centerY = (topY + bottomY) / 2;
        const zMin = STAGE_DEPTH + i * STAIR_DEPTH;
        const zCenter = zMin + STAIR_DEPTH / 2;

        return (
          <group key={i}>
            <mesh position={[centerX, centerY, zCenter]} castShadow receiveShadow>
              <boxGeometry args={[STAIR_WIDTH, stepHeight, STAIR_DEPTH]} />
              <meshStandardMaterial
                color={STAGE_COLORS.stagePlank}
                roughness={STAGE_MATERIAL.plank.roughness}
                metalness={STAGE_MATERIAL.plank.metalness}
              />
            </mesh>
            <mesh position={[centerX, topY - NOSING_HEIGHT / 2, zMin + 0.02]} castShadow>
              <boxGeometry args={[STAIR_WIDTH, NOSING_HEIGHT, 0.04]} />
              <meshStandardMaterial color={STAGE_COLORS.stageSkirt} roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
