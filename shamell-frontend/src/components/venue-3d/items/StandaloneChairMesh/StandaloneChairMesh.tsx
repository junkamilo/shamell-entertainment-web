"use client";

import { memo } from "react";
import VenueBanquetChairMesh from "../../chair/VenueBanquetChairMesh";
import type { VenuePerfProfile } from "../../venueScenePerformance";

export type StandaloneChairMeshProps = {
  selected?: boolean;
  reserved?: boolean;
  perfProfile?: VenuePerfProfile;
};

function StandaloneChairMesh({
  selected = false,
  reserved = false,
  perfProfile = "high",
}: StandaloneChairMeshProps) {
  return (
    <VenueBanquetChairMesh
      selected={selected && !reserved}
      reserved={reserved}
      perfProfile={perfProfile}
    />
  );
}

export default memo(StandaloneChairMesh);
