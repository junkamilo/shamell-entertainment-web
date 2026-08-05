"use client";

import { STAGE_COLORS } from "../stageMaterials";
import {
  PALM_FROND_ANGLES,
  palmFrondTransforms,
} from "../lib/palmFrondTransforms";

export type StagePalmPlantProps = {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
};

export default function StagePalmPlant({
  position,
  scale = 1,
  rotationY = 0,
}: StagePalmPlantProps) {
  const potH = 0.25 * scale;
  const frondBaseY = position[1] + potH;
  const fronds = palmFrondTransforms(scale, frondBaseY, PALM_FROND_ANGLES);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, potH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.16 * scale, 0.13 * scale, potH, 12]} />
        <meshStandardMaterial color={STAGE_COLORS.marqueeWire} roughness={0.45} metalness={0.45} />
      </mesh>
      {fronds.map((frond, i) => (
        <mesh key={i} position={frond.position} rotation={frond.rotation}>
          <coneGeometry args={[0.14 * scale, 0.55 * scale, 6]} />
          <meshStandardMaterial
            color={STAGE_COLORS.palmFrond}
            emissive={STAGE_COLORS.palmFrondEmissive}
            emissiveIntensity={0.22}
            roughness={0.88}
          />
        </mesh>
      ))}
    </group>
  );
}
