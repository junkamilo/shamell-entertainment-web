"use client";

import { STAGE_COLORS, STAGE_MATERIAL } from "../stage/stageMaterials";
import {
  STAGE_DEPTH,
  STAGE_SCALE,
  STAGE_ZONE_ROTATION_Y,
  stageLocalToWorld,
} from "../stage/stageConstants";

/** Runs along the stage side; depth protrudes toward the room. */
const BENCH_LENGTH = STAGE_DEPTH * 0.88;
const BENCH_DEPTH = 1.15 * STAGE_SCALE;
const BENCH_STAGE_GAP = 0.12 * STAGE_SCALE;

const BASE_HEIGHT = 0.26 * STAGE_SCALE;
const CUSHION_HEIGHT = 0.34 * STAGE_SCALE;
const BACKREST_HEIGHT = 0.52 * STAGE_SCALE;
const BACKREST_THICKNESS = 0.14 * STAGE_SCALE;
export default function VenueDancerBench() {
  const [x, z] = stageLocalToWorld(-BENCH_DEPTH - BENCH_STAGE_GAP, STAGE_DEPTH / 2);

  return (
    <group position={[x, 0, z]} rotation={[0, STAGE_ZONE_ROTATION_Y, 0]}>
      {/* Skirt / wood base */}
      <mesh position={[BENCH_DEPTH / 2, BASE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BENCH_DEPTH, BASE_HEIGHT, BENCH_LENGTH]} />
        <meshStandardMaterial
          color={STAGE_COLORS.stageSkirt}
          roughness={STAGE_MATERIAL.skirt.roughness}
        />
      </mesh>

      {/* Velvet seat cushion */}
      <mesh
        position={[BENCH_DEPTH / 2, BASE_HEIGHT + CUSHION_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BENCH_DEPTH * 0.94, CUSHION_HEIGHT, BENCH_LENGTH * 0.96]} />
        <meshStandardMaterial
          color={STAGE_COLORS.velvetRed}
          roughness={STAGE_MATERIAL.velvet.roughness}
          metalness={STAGE_MATERIAL.velvet.metalness}
        />
      </mesh>

      {/* Backrest (outer edge, away from stage) */}
      <mesh
        position={[
          BENCH_DEPTH - BACKREST_THICKNESS / 2 - 0.02,
          BASE_HEIGHT + CUSHION_HEIGHT + BACKREST_HEIGHT / 2,
          0,
        ]}
        castShadow
      >
        <boxGeometry args={[BACKREST_THICKNESS, BACKREST_HEIGHT, BENCH_LENGTH * 0.92]} />
        <meshStandardMaterial
          color={STAGE_COLORS.velvetRed}
          roughness={STAGE_MATERIAL.velvet.roughness}
        />
      </mesh>

      {/* Gold accent strip on seat front */}
      <mesh
        position={[BENCH_DEPTH - 0.03, BASE_HEIGHT + CUSHION_HEIGHT + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[BENCH_LENGTH * 0.9, 0.04]} />
        <meshStandardMaterial
          color={STAGE_COLORS.marqueeWire}
          roughness={0.35}
          metalness={0.55}
        />
      </mesh>
    </group>
  );
}
