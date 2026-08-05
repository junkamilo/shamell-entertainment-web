"use client";

import { memo, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { VenuePerfProfile } from "../../lib/venueScenePerformance";
import { CHAIR_BACK, CHAIR_LEG, CHAIR_MATERIAL, CHAIR_SEAT } from "../lib/chairConstants";
import { getChairSharedGeometries } from "../lib/chairSharedGeometries";
import { resolveChairMaterialState } from "../lib/resolveChairMaterialState";

export type VenueBanquetChairMeshProps = {
  selected?: boolean;
  reserved?: boolean;
  /** Rotate chair so back faces outward when placed in a ring (radians). */
  rotationY?: number;
  perfProfile?: VenuePerfProfile;
};

function VenueBanquetChairMesh({
  selected = false,
  reserved = false,
  rotationY = 0,
  perfProfile = "high",
}: VenueBanquetChairMeshProps) {
  const { velvet, frame, emissiveIntensity } = resolveChairMaterialState(
    selected,
    reserved,
  );
  const castShadow = perfProfile !== "mobile";

  const geometries = useMemo(() => getChairSharedGeometries(perfProfile), [perfProfile]);

  const legInsetX = CHAIR_SEAT.width * 0.38;
  const legInsetZ = CHAIR_SEAT.depth * 0.38;
  const legPositions: [number, number, number][] = [
    [-legInsetX, CHAIR_LEG.height / 2, -legInsetZ],
    [legInsetX, CHAIR_LEG.height / 2, -legInsetZ],
    [-legInsetX, CHAIR_LEG.height / 2, legInsetZ],
    [legInsetX, CHAIR_LEG.height / 2, legInsetZ],
  ];

  const seatSmoothness = perfProfile === "mobile" ? 2 : 4;

  const seatPosition: [number, number, number] = [0, CHAIR_SEAT.y, 0];

  return (
    <group rotation={[0, rotationY, 0]}>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow={castShadow} geometry={geometries.leg}>
          <meshStandardMaterial
            color={frame}
            roughness={CHAIR_MATERIAL.frame.roughness}
            metalness={CHAIR_MATERIAL.frame.metalness}
          />
        </mesh>
      ))}

      {perfProfile === "mobile" ? (
        <mesh
          position={seatPosition}
          castShadow={castShadow}
          receiveShadow
          geometry={geometries.seat}
        >
          <meshStandardMaterial
            color={velvet}
            emissive={velvet}
            emissiveIntensity={emissiveIntensity}
            roughness={CHAIR_MATERIAL.velvet.roughness}
            metalness={CHAIR_MATERIAL.velvet.metalness}
          />
        </mesh>
      ) : (
        <RoundedBox
          args={[CHAIR_SEAT.width, CHAIR_SEAT.height, CHAIR_SEAT.depth]}
          radius={CHAIR_SEAT.cornerRadius}
          smoothness={seatSmoothness}
          position={[0, CHAIR_SEAT.y, 0]}
          castShadow={castShadow}
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
      )}

      <mesh
        position={[0, CHAIR_SEAT.y + CHAIR_BACK.height * 0.35, CHAIR_BACK.z]}
        castShadow={castShadow}
        receiveShadow
        geometry={geometries.back}
      >
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
        castShadow={castShadow}
        geometry={geometries.backCap}
      >
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

export default memo(VenueBanquetChairMesh);
