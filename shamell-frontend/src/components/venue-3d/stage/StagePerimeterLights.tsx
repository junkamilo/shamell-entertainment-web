"use client";

import { useLayoutEffect, useRef } from "react";
import type { InstancedMesh } from "three";
import { Object3D } from "three";
import { STAGE_COLORS, STAGE_MATERIAL } from "./stageMaterials";
import {
  LIGHT_EDGE_MARGIN,
  LIGHT_SPACING,
  LIGHT_SPHERE_RADIUS,
  LIGHT_Y_OFFSET,
  STAGE_DEPTH,
  STAGE_TOP_Y,
  STAGE_WIDTH,
} from "./stageConstants";

function positionsAlongEdge(
  start: [number, number, number],
  end: [number, number, number],
  spacing: number,
): [number, number, number][] {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const count = Math.max(2, Math.floor(len / spacing) + 1);
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    out.push([start[0] + dx * t, start[1] + dy * t, start[2] + dz * t]);
  }
  return out;
}

const LIGHT_Y = STAGE_TOP_Y + LIGHT_Y_OFFSET;
const M = LIGHT_EDGE_MARGIN;

const STAGE_PERIMETER_LIGHT_POSITIONS: [number, number, number][] = [
  ...positionsAlongEdge(
    [M, LIGHT_Y, STAGE_DEPTH + 0.04],
    [STAGE_WIDTH - M, LIGHT_Y, STAGE_DEPTH + 0.04],
    LIGHT_SPACING,
  ),
  ...positionsAlongEdge(
    [0.04, LIGHT_Y, M],
    [0.04, LIGHT_Y, STAGE_DEPTH - M],
    LIGHT_SPACING,
  ),
  ...positionsAlongEdge(
    [STAGE_WIDTH - 0.04, LIGHT_Y, M],
    [STAGE_WIDTH - 0.04, LIGHT_Y, STAGE_DEPTH - M],
    LIGHT_SPACING,
  ),
];

export default function StagePerimeterLights() {
  const instancedRef = useRef<InstancedMesh>(null);
  const wireRef = useRef<InstancedMesh>(null);
  const positions = STAGE_PERIMETER_LIGHT_POSITIONS;

  useLayoutEffect(() => {
    const mesh = instancedRef.current;
    const wires = wireRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    positions.forEach((pos, i) => {
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (wires) {
        dummy.position.set(pos[0], pos[1] - 0.06, pos[2]);
        dummy.scale.set(1, 1.2, 1);
        dummy.updateMatrix();
        wires.setMatrixAt(i, dummy.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (wires) wires.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <group>
      <instancedMesh ref={instancedRef} args={[undefined, undefined, positions.length]} castShadow>
        <sphereGeometry args={[LIGHT_SPHERE_RADIUS, 8, 8]} />
        <meshStandardMaterial
          color={STAGE_COLORS.marqueeBulb}
          emissive={STAGE_COLORS.marqueeBulb}
          emissiveIntensity={STAGE_MATERIAL.bulb.emissiveIntensity}
        />
      </instancedMesh>
      <instancedMesh ref={wireRef} args={[undefined, undefined, positions.length]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
        <meshStandardMaterial color={STAGE_COLORS.marqueeWire} roughness={0.7} metalness={0.3} />
      </instancedMesh>
    </group>
  );
}
