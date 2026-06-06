"use client";

import { Suspense, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { ClampToEdgeWrapping } from "three";
import {
  FLOOR_MATERIAL,
  FLOOR_TEXTURE_PATH,
  FLOOR_TEXTURE_REPEAT,
  VENUE_COLORS,
  WORLD_DEPTH,
  WORLD_WIDTH,
} from "./venueSceneConstants";

function WoodFloorTextured() {
  const sourceTexture = useTexture(FLOOR_TEXTURE_PATH);
  const hw = WORLD_WIDTH / 2;
  const hd = WORLD_DEPTH / 2;

  const texture = useMemo(() => {
    const configured = sourceTexture.clone();
    configured.wrapS = ClampToEdgeWrapping;
    configured.wrapT = ClampToEdgeWrapping;
    configured.repeat.set(FLOOR_TEXTURE_REPEAT[0], FLOOR_TEXTURE_REPEAT[1]);
    configured.anisotropy = 8;
    configured.needsUpdate = true;
    return configured;
  }, [sourceTexture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[hw, 0, hd]} receiveShadow>
      <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
      <meshStandardMaterial
        map={texture}
        color="#ffffff"
        roughness={FLOOR_MATERIAL.roughness}
        metalness={FLOOR_MATERIAL.metalness}
        envMapIntensity={FLOOR_MATERIAL.envMapIntensity}
      />
    </mesh>
  );
}

function WoodFloorFallback() {
  const hw = WORLD_WIDTH / 2;
  const hd = WORLD_DEPTH / 2;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[hw, 0, hd]} receiveShadow>
      <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
      <meshStandardMaterial
        color={VENUE_COLORS.floorWood}
        roughness={FLOOR_MATERIAL.roughness}
        metalness={FLOOR_MATERIAL.metalness}
      />
    </mesh>
  );
}

export default function VenueWoodFloor() {
  return (
    <Suspense fallback={<WoodFloorFallback />}>
      <WoodFloorTextured />
    </Suspense>
  );
}
