"use client";

import RedCarpetRunner from "./carpet/RedCarpetRunner";
import VenueStage from "./stage/VenueStage";
import VenueWallSconces from "./VenueWallSconces";
import VenueWoodFloor from "./VenueWoodFloor";
import { VENUE_COLORS, WORLD_DEPTH, WORLD_WIDTH } from "./venueSceneConstants";

export default function VenueRoomPlaceholder() {
  const hw = WORLD_WIDTH / 2;
  const hd = WORLD_DEPTH / 2;

  return (
    <group>
      <VenueWoodFloor />

      <VenueStage />
      <RedCarpetRunner />

      {/* Back wall */}
      <mesh position={[hw, 2.5, 0.08]} receiveShadow>
        <boxGeometry args={[WORLD_WIDTH + 1, 5, 0.2]} />
        <meshStandardMaterial color={VENUE_COLORS.wall} roughness={0.9} />
      </mesh>

      {/* Left wall */}
      <mesh position={[0.08, 2.5, hd]} receiveShadow>
        <boxGeometry args={[0.2, 5, WORLD_DEPTH + 1]} />
        <meshStandardMaterial color={VENUE_COLORS.wall} roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[WORLD_WIDTH - 0.08, 2.5, hd]} receiveShadow>
        <boxGeometry args={[0.2, 5, WORLD_DEPTH + 1]} />
        <meshStandardMaterial color={VENUE_COLORS.wall} roughness={0.9} />
      </mesh>

      <VenueWallSconces />
    </group>
  );
}
