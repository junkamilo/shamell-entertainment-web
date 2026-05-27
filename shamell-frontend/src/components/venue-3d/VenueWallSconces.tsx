"use client";

import { STAGE_COLORS } from "./stage/stageMaterials";
import { WORLD_DEPTH, WORLD_WIDTH } from "./venueSceneConstants";

const SCONCE_HEIGHT = 2.2;

export default function VenueWallSconces() {
  const hw = WORLD_WIDTH / 2;
  const hd = WORLD_DEPTH / 2;

  const leftWall: [number, number, number][] = [
    [0.22, SCONCE_HEIGHT, hd * 0.25],
    [0.22, SCONCE_HEIGHT, hd * 0.55],
    [0.22, SCONCE_HEIGHT, hd * 0.85],
  ];

  const backWall: [number, number, number][] = [
    [hw * 0.35, SCONCE_HEIGHT, 0.22],
    [hw * 0.65, SCONCE_HEIGHT, 0.22],
    [hw, SCONCE_HEIGHT, 0.22],
  ];

  const positions = [...leftWall, ...backWall];

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.1, 0.12, 8]} />
            <meshStandardMaterial color="#2a1510" roughness={0.8} />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color={STAGE_COLORS.wallSconce}
              emissive={STAGE_COLORS.wallSconce}
              emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight
            position={[0.15, -0.2, 0]}
            intensity={0.42}
            color={STAGE_COLORS.wallSconce}
            distance={4}
          />
        </group>
      ))}
    </group>
  );
}
