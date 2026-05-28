"use client";

import { useFloorSceneZones } from "../FloorSceneZonesContext";
import {
  STAGE_ZONE_POSITION,
  STAGE_ZONE_ROTATION_Y,
} from "./stageConstants";
import StageBackdrop from "./StageBackdrop";
import StagePerimeterLights from "./StagePerimeterLights";
import StagePlatform from "./StagePlatform";
import StageStairs from "./StageStairs";
import StageZoneLights from "./StageZoneLights";

/** Fixed venue stage (platform, marquee lights, stairs, plants, backdrop). */
export default function VenueStage() {
  const zones = useFloorSceneZones();
  const stage = zones.stage;
  const position: [number, number, number] = [
    stage?.x ?? STAGE_ZONE_POSITION[0],
    0,
    stage?.z ?? STAGE_ZONE_POSITION[2],
  ];
  const rotationY = stage?.rotationY ?? STAGE_ZONE_ROTATION_Y;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <StageBackdrop />
      <StagePlatform />
      <StagePerimeterLights />
      <StageStairs />
      <StageZoneLights />
    </group>
  );
}
