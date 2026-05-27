"use client";

import { WORLD_DEPTH, WORLD_WIDTH } from "./venueSceneConstants";

type Props = {
  onPointerMissed?: () => void;
};

export default function FloorPickPlane({ onPointerMissed }: Props) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[WORLD_WIDTH / 2, 0.001, WORLD_DEPTH / 2]}
      visible={false}
      onPointerMissed={onPointerMissed}
    >
      <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
