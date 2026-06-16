"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  type InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { VenuePerfProfile } from "../venueScenePerformance";
import { CHAIR_COLORS, CHAIR_MATERIAL } from "./chairConstants";
import {
  CHAIR_BACK_CAP_OFFSET,
  CHAIR_BACK_OFFSET,
  CHAIR_LEG_OFFSETS,
  CHAIR_SEAT_OFFSET,
  type ChairInstancePlacement,
  type ChairInstanceState,
} from "./chairInstanceBuilder";
import { getChairSharedGeometries } from "./chairSharedGeometries";

type Props = {
  placements: ChairInstancePlacement[];
  perfProfile?: VenuePerfProfile;
  castShadow?: boolean;
};

const STATE_MATERIALS: Record<
  ChairInstanceState,
  { velvet: string; frame: string; emissiveIntensity: number }
> = {
  available: {
    velvet: CHAIR_COLORS.velvet,
    frame: CHAIR_COLORS.frame,
    emissiveIntensity: 0,
  },
  selected: {
    velvet: CHAIR_COLORS.velvetHighlight,
    frame: CHAIR_COLORS.frame,
    emissiveIntensity: 0.15,
  },
  reserved: {
    velvet: CHAIR_COLORS.velvetReserved,
    frame: CHAIR_COLORS.frameReserved,
    emissiveIntensity: 0,
  },
};

type PartKind = "leg" | "seat" | "back" | "backCap";

const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3(1, 1, 1);
const _localOffset = new Vector3();
const _partMatrix = new Matrix4();

function setPartMatrix(
  mesh: InstancedMesh,
  index: number,
  chairMatrix: Matrix4,
  partOffset: [number, number, number],
) {
  chairMatrix.decompose(_position, _quaternion, _scale);
  _localOffset.set(partOffset[0], partOffset[1], partOffset[2]);
  _localOffset.applyQuaternion(_quaternion);
  _position.add(_localOffset);
  _partMatrix.compose(_position, _quaternion, _scale);
  mesh.setMatrixAt(index, _partMatrix);
}

function applyPartMatrices(
  mesh: InstancedMesh,
  chairMatrices: Matrix4[],
  partOffset: [number, number, number],
) {
  for (let i = 0; i < chairMatrices.length; i++) {
    setPartMatrix(mesh, i, chairMatrices[i], partOffset);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function InstancedChairPart({
  chairMatrices,
  part,
  material,
  geometry,
  castShadow,
}: {
  chairMatrices: Matrix4[];
  part: PartKind;
  material: MeshStandardMaterial;
  geometry: import("three").BufferGeometry;
  castShadow: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const count = part === "leg" ? chairMatrices.length * 4 : chairMatrices.length;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || chairMatrices.length === 0) return;

    if (part === "leg") {
      let idx = 0;
      for (const chairMatrix of chairMatrices) {
        for (const offset of CHAIR_LEG_OFFSETS) {
          setPartMatrix(mesh, idx, chairMatrix, offset);
          idx += 1;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    } else {
      const offset =
        part === "seat"
          ? CHAIR_SEAT_OFFSET
          : part === "back"
            ? CHAIR_BACK_OFFSET
            : CHAIR_BACK_CAP_OFFSET;
      applyPartMatrices(mesh, chairMatrices, offset);
    }
    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [chairMatrices, invalidate, part]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow={part === "seat" || part === "back"}
    />
  );
}

function InstancedChairStateGroup({
  state,
  chairMatrices,
  geometries,
  castShadow,
}: {
  state: ChairInstanceState;
  chairMatrices: Matrix4[];
  geometries: ReturnType<typeof getChairSharedGeometries>;
  castShadow: boolean;
}) {
  const mats = STATE_MATERIALS[state];

  const frameMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: mats.frame,
        roughness: CHAIR_MATERIAL.frame.roughness,
        metalness: CHAIR_MATERIAL.frame.metalness,
      }),
    [mats.frame],
  );

  const velvetMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: mats.velvet,
        emissive: mats.velvet,
        emissiveIntensity: mats.emissiveIntensity,
        roughness: CHAIR_MATERIAL.velvet.roughness,
        metalness: CHAIR_MATERIAL.velvet.metalness,
      }),
    [mats.emissiveIntensity, mats.velvet],
  );

  if (chairMatrices.length === 0) return null;

  return (
    <group>
      <InstancedChairPart
        chairMatrices={chairMatrices}
        part="leg"
        geometry={geometries.leg}
        material={frameMaterial}
        castShadow={castShadow}
      />
      <InstancedChairPart
        chairMatrices={chairMatrices}
        part="seat"
        geometry={geometries.seat}
        material={velvetMaterial}
        castShadow={castShadow}
      />
      <InstancedChairPart
        chairMatrices={chairMatrices}
        part="back"
        geometry={geometries.back}
        material={velvetMaterial}
        castShadow={castShadow}
      />
      <InstancedChairPart
        chairMatrices={chairMatrices}
        part="backCap"
        geometry={geometries.backCap}
        material={velvetMaterial}
        castShadow={castShadow}
      />
    </group>
  );
}

export default function InstancedBanquetChairs({
  placements,
  perfProfile = "high",
  castShadow = true,
}: Props) {
  const geometries = useMemo(
    () => getChairSharedGeometries(perfProfile),
    [perfProfile],
  );

  const byState = useMemo(() => {
    const buckets: Record<ChairInstanceState, Matrix4[]> = {
      available: [],
      selected: [],
      reserved: [],
    };
    for (const p of placements) {
      buckets[p.state].push(p.matrix);
    }
    return buckets;
  }, [placements]);

  return (
    <group>
      {(["available", "selected", "reserved"] as const).map((state) => (
        <InstancedChairStateGroup
          key={state}
          state={state}
          chairMatrices={byState[state]}
          geometries={geometries}
          castShadow={castShadow}
        />
      ))}
    </group>
  );
}
