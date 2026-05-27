"use client";

import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  resolveCameraPresetForAspect,
  type VenueSceneLayoutBucket,
} from "./venueSceneConstants";

type Props = {
  bucket: VenueSceneLayoutBucket;
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>;
};

export default function ResponsiveVenueCamera({ bucket, orbitControlsRef }: Props) {
  const { camera, size } = useThree();
  const lastKeyRef = useRef("");

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    if (size.width <= 0 || size.height <= 0) return;

    const aspect = size.width / size.height;
    const preset = resolveCameraPresetForAspect(bucket, aspect);
    const key = `${bucket}:${aspect.toFixed(2)}:${preset.fov}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    camera.position.set(preset.position[0], preset.position[1], preset.position[2]);
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();

    const controls = orbitControlsRef.current;
    if (controls) {
      controls.target.set(preset.target[0], preset.target[1], preset.target[2]);
      controls.minDistance = preset.minDistance;
      controls.maxDistance = preset.maxDistance;
      controls.update();
    }
  }, [bucket, camera, orbitControlsRef, size.height, size.width]);

  return null;
}
