"use client";

import { STAGE_COLORS } from "./stageMaterials";

type Props = {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
};

const FROND_ANGLES = [-0.9, -0.35, 0.15, 0.55, 0.95, 1.35];

export default function StagePalmPlant({ position, scale = 1, rotationY = 0 }: Props) {
  const potH = 0.25 * scale;
  const frondBaseY = position[1] + potH;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, potH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.16 * scale, 0.13 * scale, potH, 12]} />
        <meshStandardMaterial color={STAGE_COLORS.marqueeWire} roughness={0.45} metalness={0.45} />
      </mesh>
      {FROND_ANGLES.map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 0.08 * scale, frondBaseY + 0.25 * scale, Math.cos(angle) * 0.06 * scale]}
          rotation={[0.25 + i * 0.04, angle, 0]}
        >
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
