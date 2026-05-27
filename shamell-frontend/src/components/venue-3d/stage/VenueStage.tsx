"use client";

import { STAGE_ZONE_POSITION, STAGE_ZONE_ROTATION_Y } from "./stageConstants";
import StageBackdrop from "./StageBackdrop";
import StagePerimeterLights from "./StagePerimeterLights";
import StagePlatform from "./StagePlatform";
import StageStairs from "./StageStairs";
import StageZoneLights from "./StageZoneLights";

/** Fixed venue stage (platform, marquee lights, stairs, plants, backdrop). */
export default function VenueStage() {
  return (
    <group position={STAGE_ZONE_POSITION} rotation={[0, STAGE_ZONE_ROTATION_Y, 0]}>
      <StageBackdrop />
      <StagePlatform />
      <StagePerimeterLights />
      <StageStairs />
      <StageZoneLights />
    </group>
  );
}
