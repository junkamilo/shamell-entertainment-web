"use client";

import { useCallback } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import type { FloorSceneZones } from "@/components/floor-layout/layoutTypes";
import { useVenueSceneCanvas } from "@/components/venue-3d/VenueSceneCanvasContext";
import {
  SCENE_CARPET_SELECT_ID,
  SCENE_STAGE_SELECT_ID,
} from "@/components/venue-3d/floorSceneZonesDefaults";
import {
  CARPET_LENGTH,
  CARPET_WIDTH,
  CARPET_Y,
  STAGE_DEPTH,
  STAGE_WIDTH,
  STAIR_COUNT,
  STAIR_DEPTH,
} from "@/components/venue-3d/stage/stageConstants";
import { pickWorldFromClient } from "../lib/floorLayoutRaycast";
import { useFloorLayoutWindowPointerDrag } from "../lib/useFloorLayoutWindowPointerDrag";

const STAGE_HIT_DEPTH = STAGE_DEPTH + STAIR_COUNT * STAIR_DEPTH;

type Props = {
  sceneZones: FloorSceneZones;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveStage: (x: number, z: number) => void;
  onMoveCarpet: (x: number, z: number) => void;
};

function SceneZoneHandle({
  id,
  position,
  rotationY,
  width,
  depth,
  y,
  selected,
  onSelect,
  onMove,
}: {
  id: string;
  position: [number, number, number];
  rotationY: number;
  width: number;
  depth: number;
  y: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (x: number, z: number) => void;
}) {
  const { camera } = useThree();
  const { getCanvas } = useVenueSceneCanvas();
  const { beginWindowPointerDrag } = useFloorLayoutWindowPointerDrag();

  const startDrag = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect(id);

      beginWindowPointerDrag(e.nativeEvent, {
        onMove: (clientX, clientY) => {
          const canvas = getCanvas();
          if (!canvas) return;
          const world = pickWorldFromClient(clientX, clientY, canvas, camera);
          if (world) onMove(world.x, world.z);
        },
      });
    },
    [beginWindowPointerDrag, camera, getCanvas, id, onMove, onSelect],
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh
        position={[width / 2, y, depth / 2]}
        onPointerDown={startDrag}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <boxGeometry args={[width, 0.4, depth]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {selected ? (
        <mesh position={[width / 2, y + 0.05, depth / 2]}>
          <boxGeometry args={[width + 0.35, 0.02, depth + 0.35]} />
          <meshBasicMaterial color="#c5a55a" wireframe transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export default function SceneDecorEditorLayer({
  sceneZones,
  selectedId,
  onSelect,
  onMoveStage,
  onMoveCarpet,
}: Props) {
  const stage = sceneZones.stage;
  const carpet = sceneZones.carpet;

  return (
    <group>
      <SceneZoneHandle
        id={SCENE_STAGE_SELECT_ID}
        position={[stage.x, 0, stage.z]}
        rotationY={stage.rotationY}
        width={STAGE_WIDTH}
        depth={STAGE_HIT_DEPTH}
        y={0.2}
        selected={selectedId === SCENE_STAGE_SELECT_ID}
        onSelect={onSelect}
        onMove={onMoveStage}
      />
      <SceneZoneHandle
        id={SCENE_CARPET_SELECT_ID}
        position={[carpet.x, CARPET_Y, carpet.z]}
        rotationY={carpet.rotationY}
        width={CARPET_WIDTH}
        depth={CARPET_LENGTH}
        y={0.05}
        selected={selectedId === SCENE_CARPET_SELECT_ID}
        onSelect={onSelect}
        onMove={onMoveCarpet}
      />
    </group>
  );
}
