"use client";

import { memo } from "react";
import VenueBanquetChairMesh from "./chair/VenueBanquetChairMesh";
import type { VenuePerfProfile } from "./venueScenePerformance";

type Props = {
  selected?: boolean;
  reserved?: boolean;
  perfProfile?: VenuePerfProfile;
};

function StandaloneChairMesh({
  selected = false,
  reserved = false,
  perfProfile = "high",
}: Props) {
  return (
    <VenueBanquetChairMesh
      selected={selected && !reserved}
      reserved={reserved}
      perfProfile={perfProfile}
    />
  );
}

export default memo(StandaloneChairMesh);
