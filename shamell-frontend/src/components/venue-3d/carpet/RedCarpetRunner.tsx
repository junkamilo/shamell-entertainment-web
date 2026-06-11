"use client";

import { useFloorSceneZones } from "../FloorSceneZonesContext";
import { VENUE_COLORS } from "../venueSceneConstants";
import {
  CARPET_LENGTH,
  CARPET_WIDTH,
  CARPET_Y,
  carpetZoneFromStage,
  STAGE_ZONE_POSITION,
  STAGE_ZONE_ROTATION_Y,
} from "../stage/stageConstants";

export default function RedCarpetRunner() {
  const zones = useFloorSceneZones();
  const stage = zones.stage ?? {
    x: STAGE_ZONE_POSITION[0],
    z: STAGE_ZONE_POSITION[2],
    rotationY: STAGE_ZONE_ROTATION_Y,
  };
  const carpet = carpetZoneFromStage(stage);
  const { x, z, rotationY } = carpet;

  return (
    <group position={[x, CARPET_Y, z]} rotation={[0, rotationY, 0]}>
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
