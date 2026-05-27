"use client";

import { STAGE_COLORS, STAGE_MATERIAL } from "./stageMaterials";
import {
  PLANK_COUNT,
  PLANK_GAP,
  STAGE_DEPTH,
  STAGE_HEIGHT,
  STAGE_SKIRT_HEIGHT,
  STAGE_TOP_Y,
  STAGE_WIDTH,
} from "./stageConstants";

export default function StagePlatform() {
  const plankWidth = (STAGE_WIDTH - PLANK_GAP * (PLANK_COUNT - 1)) / PLANK_COUNT;

  return (
    <group>
      <mesh
        position={[STAGE_WIDTH / 2, STAGE_HEIGHT / 2, STAGE_DEPTH / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[STAGE_WIDTH, STAGE_HEIGHT, STAGE_DEPTH]} />
        <meshStandardMaterial
          color={STAGE_COLORS.stageWood}
          roughness={STAGE_MATERIAL.wood.roughness}
          metalness={STAGE_MATERIAL.wood.metalness}
        />
      </mesh>

      {/* Front skirt */}
      <mesh position={[STAGE_WIDTH / 2, STAGE_SKIRT_HEIGHT / 2, STAGE_DEPTH + 0.03]} castShadow>
        <boxGeometry args={[STAGE_WIDTH, STAGE_SKIRT_HEIGHT, 0.08]} />
        <meshStandardMaterial
          color={STAGE_COLORS.stageSkirt}
          roughness={STAGE_MATERIAL.skirt.roughness}
        />
      </mesh>

      {/* Wood planks on top */}
      {Array.from({ length: PLANK_COUNT }, (_, i) => {
        const x = plankWidth / 2 + i * (plankWidth + PLANK_GAP);
        const tone = i % 2 === 0 ? STAGE_COLORS.stagePlank : STAGE_COLORS.stagePlankAlt;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, STAGE_TOP_Y + 0.003, STAGE_DEPTH / 2]}
            receiveShadow
          >
            <planeGeometry args={[plankWidth, STAGE_DEPTH * 0.96]} />
            <meshStandardMaterial
              color={tone}
              roughness={STAGE_MATERIAL.plank.roughness}
              metalness={STAGE_MATERIAL.plank.metalness}
            />
          </mesh>
        );
      })}

      {/* Front lip */}
      <mesh position={[STAGE_WIDTH / 2, STAGE_HEIGHT - 0.02, STAGE_DEPTH + 0.025]} castShadow>
        <boxGeometry args={[STAGE_WIDTH, 0.04, 0.05]} />
        <meshStandardMaterial color={STAGE_COLORS.stageSkirt} roughness={0.85} />
      </mesh>
    </group>
  );
}
