"use client";

import { RoundedBox } from "@react-three/drei";
import { CHAIR_BACK, CHAIR_COLORS, CHAIR_LEG, CHAIR_MATERIAL, CHAIR_SEAT } from "./chairConstants";

type Props = {
  selected?: boolean;
  /** Rotate chair so back faces outward when placed in a ring (radians). */
  rotationY?: number;
};

export default function VenueBanquetChairMesh({ selected = false, rotationY = 0 }: Props) {
  const velvet = selected ? CHAIR_COLORS.velvetHighlight : CHAIR_COLORS.velvet;
  const emissiveIntensity = selected ? 0.15 : 0;

  const legInsetX = CHAIR_SEAT.width * 0.38;
  const legInsetZ = CHAIR_SEAT.depth * 0.38;
  const legPositions: [number, number, number][] = [
    [-legInsetX, CHAIR_LEG.height / 2, -legInsetZ],
    [legInsetX, CHAIR_LEG.height / 2, -legInsetZ],
    [-legInsetX, CHAIR_LEG.height / 2, legInsetZ],
    [legInsetX, CHAIR_LEG.height / 2, legInsetZ],
  ];

  return (
    <group rotation={[0, rotationY, 0]}>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[CHAIR_LEG.radius, CHAIR_LEG.radius * 0.85, CHAIR_LEG.height, 8]} />
          <meshStandardMaterial
            color={CHAIR_COLORS.frame}
            roughness={CHAIR_MATERIAL.frame.roughness}
            metalness={CHAIR_MATERIAL.frame.metalness}
          />
        </mesh>
      ))}

      <RoundedBox
        args={[CHAIR_SEAT.width, CHAIR_SEAT.height, CHAIR_SEAT.depth]}
        radius={CHAIR_SEAT.cornerRadius}
        smoothness={4}
        position={[0, CHAIR_SEAT.y, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={velvet}
          emissive={velvet}
          emissiveIntensity={emissiveIntensity}
          roughness={CHAIR_MATERIAL.velvet.roughness}
          metalness={CHAIR_MATERIAL.velvet.metalness}
        />
      </RoundedBox>

      <mesh
        position={[0, CHAIR_SEAT.y + CHAIR_BACK.height * 0.35, CHAIR_BACK.z]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[CHAIR_BACK.width, CHAIR_BACK.height, CHAIR_BACK.thickness]} />
        <meshStandardMaterial
          color={velvet}
          emissive={velvet}
          emissiveIntensity={emissiveIntensity}
          roughness={CHAIR_MATERIAL.velvet.roughness}
          metalness={CHAIR_MATERIAL.velvet.metalness}
        />
      </mesh>

      <mesh
        position={[0, CHAIR_SEAT.y + CHAIR_BACK.height * 0.72, CHAIR_BACK.z]}
        castShadow
      >
        <cylinderGeometry
          args={[CHAIR_BACK.topRadius, CHAIR_BACK.topRadius * 0.9, 0.06, 12]}
        />
        <meshStandardMaterial
          color={velvet}
          emissive={velvet}
          emissiveIntensity={emissiveIntensity}
          roughness={CHAIR_MATERIAL.velvet.roughness}
        />
      </mesh>
    </group>
  );
}
