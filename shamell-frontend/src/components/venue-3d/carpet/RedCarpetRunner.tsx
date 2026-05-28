"use client";

import { VENUE_COLORS } from "../venueSceneConstants";
import {
  CARPET_LENGTH,
  CARPET_WIDTH,
  CARPET_Y,
  STAGE_ZONE_ROTATION_Y,
  getStageStairsFrontWorld,
} from "../stage/stageConstants";

export default function RedCarpetRunner() {
  const [frontX, frontZ] = getStageStairsFrontWorld();

  return (
    <group position={[frontX, CARPET_Y, frontZ]} rotation={[0, STAGE_ZONE_ROTATION_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CARPET_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[CARPET_WIDTH, CARPET_LENGTH]} />
        <meshStandardMaterial color={VENUE_COLORS.carpet} roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Gold side borders */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-CARPET_WIDTH / 2 - 0.02, 0.001, CARPET_LENGTH / 2]}>
        <planeGeometry args={[0.04, CARPET_LENGTH]} />
        <meshStandardMaterial color={VENUE_COLORS.gold} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CARPET_WIDTH / 2 + 0.02, 0.001, CARPET_LENGTH / 2]}>
        <planeGeometry args={[0.04, CARPET_LENGTH]} />
        <meshStandardMaterial color={VENUE_COLORS.gold} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}
