"use client";

import VenueBanquetChairMesh from "./chair/VenueBanquetChairMesh";

type Props = {
  selected?: boolean;
  reserved?: boolean;
};

export default function StandaloneChairMesh({ selected = false, reserved = false }: Props) {
  return <VenueBanquetChairMesh selected={selected || reserved} />;
}
