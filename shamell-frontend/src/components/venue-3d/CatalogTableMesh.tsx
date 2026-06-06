"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { VenueTableSize } from "@/components/floor-layout/layoutTypes";
import VenueBanquetChairMesh from "./chair/VenueBanquetChairMesh";
import { CHAIR_SEAT } from "./chair/chairConstants";
import { TABLE_WORLD, VENUE_COLORS } from "./venueSceneConstants";

/** Clearance from table edge to chair seat (world meters). */
const CHAIR_TABLE_EDGE_GAP = 0.06;

type Props = {
  size: VenueTableSize;
  includedChairs: number;
  tableName?: string;
  selected?: boolean;
  reserved?: boolean;
  spawnScale?: number;
};

export default function CatalogTableMesh({
  size,
  includedChairs,
  selected = false,
  reserved = false,
  spawnScale = 1,
}: Props) {
  const groupRef = useRef<Group>(null);
  const scaleRef = useRef(spawnScale < 1 ? spawnScale : 1);
  const cfg = TABLE_WORLD[size];

  useFrame(() => {
    if (!groupRef.current || scaleRef.current >= 1) return;
    scaleRef.current = Math.min(1, scaleRef.current + 0.08);
    const s = scaleRef.current;
    groupRef.current.scale.set(s, s, s);
  });

  const chairPlacements = useMemo(() => {
    const n = Math.max(1, includedChairs);
    const r = cfg.tableRadius + CHAIR_SEAT.depth * 0.5 + CHAIR_TABLE_EDGE_GAP;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      return {
        position: [x, 0, z] as [number, number, number],
        rotationY: Math.atan2(x, z) + Math.PI,
      };
    });
  }, [includedChairs, cfg.tableRadius]);

  return (
    <group ref={groupRef}>
      {/* Table top */}
      <mesh position={[0, cfg.tableHeight, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[cfg.tableRadius, cfg.tableRadius * 0.92, 0.08, 24]} />
        <meshStandardMaterial
          color={reserved ? VENUE_COLORS.tableTopReserved : VENUE_COLORS.tableTop}
          emissive={reserved ? "#000000" : selected ? "#332200" : "#000000"}
          emissiveIntensity={reserved ? 0 : selected ? 0.3 : 0}
        />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, cfg.tableHeight * 0.45, 0]} castShadow>
        <cylinderGeometry args={[cfg.tableRadius * 0.35, cfg.tableRadius * 0.5, cfg.tableHeight * 0.85, 16]} />
        <meshStandardMaterial
          color={reserved ? VENUE_COLORS.tableBaseReserved : VENUE_COLORS.tableBase}
        />
      </mesh>
      {/* Center accent */}
      <mesh position={[0, cfg.tableHeight + 0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
        <meshStandardMaterial
          color={VENUE_COLORS.stageLights}
          emissive={VENUE_COLORS.stageLights}
          emissiveIntensity={1.5}
        />
      </mesh>
      {chairPlacements.map(({ position, rotationY }, i) => (
        <group key={i} position={position}>
          <VenueBanquetChairMesh
            selected={selected && !reserved}
            reserved={reserved}
            rotationY={rotationY}
          />
        </group>
      ))}
    </group>
  );
}
