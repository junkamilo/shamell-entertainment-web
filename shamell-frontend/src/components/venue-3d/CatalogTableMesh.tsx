"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { VenueTableSize } from "@/components/floor-layout/layoutTypes";
import VenueBanquetChairMesh from "./chair/VenueBanquetChairMesh";
import { buildTableChairPlacements } from "./chair/catalogTableChairPlacements";
import { getTableSharedGeometries } from "./chair/chairSharedGeometries";
import type { VenuePerfProfile } from "./venueScenePerformance";
import { TABLE_WORLD, VENUE_COLORS } from "./venueSceneConstants";

type Props = {
  size: VenueTableSize;
  includedChairs: number;
  tableName?: string;
  selected?: boolean;
  reserved?: boolean;
  spawnScale?: number;
  perfProfile?: VenuePerfProfile;
  renderChairs?: boolean;
};

function CatalogTableMesh({
  size,
  includedChairs,
  selected = false,
  reserved = false,
  spawnScale = 1,
  perfProfile = "high",
  renderChairs = true,
}: Props) {
  const groupRef = useRef<Group>(null);
  const scaleRef = useRef(spawnScale < 1 ? spawnScale : 1);
  const cfg = TABLE_WORLD[size];
  const castShadow = perfProfile !== "mobile";
  const animateSpawn = spawnScale < 1;

  useFrame(() => {
    if (!animateSpawn || !groupRef.current || scaleRef.current >= 1) return;
    scaleRef.current = Math.min(1, scaleRef.current + 0.08);
    const s = scaleRef.current;
    groupRef.current.scale.set(s, s, s);
  });

  const chairPlacements = useMemo(
    () => buildTableChairPlacements(size, includedChairs),
    [includedChairs, size],
  );

  const geometries = useMemo(
    () => getTableSharedGeometries(cfg.tableRadius, cfg.tableHeight, perfProfile),
    [cfg.tableHeight, cfg.tableRadius, perfProfile],
  );

  return (
    <group ref={groupRef}>
      <mesh
        position={[0, cfg.tableHeight, 0]}
        castShadow={castShadow}
        receiveShadow
        geometry={geometries.top}
      >
        <meshStandardMaterial
          color={reserved ? VENUE_COLORS.tableTopReserved : VENUE_COLORS.tableTop}
          emissive={reserved ? "#000000" : selected ? "#332200" : "#000000"}
          emissiveIntensity={reserved ? 0 : selected ? 0.3 : 0}
          roughness={0.9}
          metalness={0.02}
          transparent={false}
          depthWrite
        />
      </mesh>
      <mesh
        position={[0, cfg.tableHeight * 0.45, 0]}
        castShadow={castShadow}
        geometry={geometries.pedestal}
      >
        <meshStandardMaterial
          color={reserved ? VENUE_COLORS.tableBaseReserved : VENUE_COLORS.tableBase}
          roughness={0.9}
          metalness={0.02}
          transparent={false}
          depthWrite
        />
      </mesh>
      <mesh position={[0, cfg.tableHeight + 0.05, 0]} geometry={geometries.accent}>
        <meshStandardMaterial
          color={VENUE_COLORS.stageLights}
          emissive={VENUE_COLORS.stageLights}
          emissiveIntensity={1.5}
        />
      </mesh>
      {renderChairs
        ? chairPlacements.map(({ position, rotationY }, i) => (
            <group key={i} position={position}>
              <VenueBanquetChairMesh
                selected={selected && !reserved}
                reserved={reserved}
                rotationY={rotationY}
                perfProfile={perfProfile}
              />
            </group>
          ))
        : null}
    </group>
  );
}

export default memo(CatalogTableMesh);
