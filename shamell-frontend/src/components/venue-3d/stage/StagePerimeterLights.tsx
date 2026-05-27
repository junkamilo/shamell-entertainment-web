"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
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

export default function StagePerimeterLights() {
  const instancedRef = useRef<InstancedMesh>(null);
  const wireRef = useRef<InstancedMesh>(null);
  const lightY = STAGE_TOP_Y + LIGHT_Y_OFFSET;
  const m = LIGHT_EDGE_MARGIN;

  const positions = useMemo(() => {
    const front = positionsAlongEdge(
      [m, lightY, STAGE_DEPTH + 0.04],
      [STAGE_WIDTH - m, lightY, STAGE_DEPTH + 0.04],
      LIGHT_SPACING,
    );
    const left = positionsAlongEdge(
      [0.04, lightY, m],
      [0.04, lightY, STAGE_DEPTH - m],
      LIGHT_SPACING,
    );
    const right = positionsAlongEdge(
      [STAGE_WIDTH - 0.04, lightY, m],
      [STAGE_WIDTH - 0.04, lightY, STAGE_DEPTH - m],
      LIGHT_SPACING,
    );
    return [...front, ...left, ...right];
  }, [lightY]);

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
