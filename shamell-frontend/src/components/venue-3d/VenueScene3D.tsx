"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import {
  resolveCameraPresetForAspect,
  SCENE_BACKGROUND,
  SCENE_FOG,
  SCENE_LIGHTING,
  type VenueCameraPreset,
  type VenueSceneLayoutBucket,
  WORLD_DEPTH,
  WORLD_WIDTH,
} from "./venueSceneConstants";
import type * as THREE from "three";
import { MOUSE, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  VenueSceneCanvasContext,
  type VenueSceneCanvasContextValue,
} from "./VenueSceneCanvasContext";
import FloorPickPlane from "./FloorPickPlane";
import PlacedItemsLayer from "./PlacedItemsLayer";
import VenueRoomPlaceholder from "./VenueRoomPlaceholder";

export type VenueScene3DHandle = VenueSceneCanvasContextValue & {
  getCamera: () => THREE.Camera | null;
};

type Props = {
  mode: "admin" | "public" | "public-select";
  viewBoxWidth: number;
  viewBoxHeight: number;
  items: PlacedLayoutItem[];
  selectedId?: string | null;
  reservedIds?: Set<string>;
  onSelect?: (id: string | null) => void;
  onItemSelect?: (id: string) => void;
  /** Must be used inside Canvas (uses useThree). */
  placedItemsAdmin?: React.ReactNode;
  onBackgroundClick?: () => void;
  canvasRef?: React.RefObject<VenueScene3DHandle | null>;
  className?: string;
  /** CSS height for the viewport (parent must be full width). */
  viewportHeight?: string;
  viewportMinHeight?: string;
  layoutBucket?: VenueSceneLayoutBucket;
  dpr?: [number, number];
};

type SceneContentProps = Omit<
  Props,
  "canvasRef" | "className" | "viewportHeight" | "viewportMinHeight" | "dpr"
> & {
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>;
  cameraPreset: VenueCameraPreset;
  cameraPresetKey: string;
};

function SceneContent({
  mode,
  viewBoxWidth,
  viewBoxHeight,
  items,
  selectedId,
  reservedIds,
  placedItemsAdmin,
  onBackgroundClick,
  onItemSelect,
  orbitControlsRef,
  cameraPreset,
  cameraPresetKey,
}: SceneContentProps) {
  const interactive = mode === "admin";
  const selectable = mode === "public-select";

  return (
    <>
      <color attach="background" args={[SCENE_BACKGROUND]} />
      <fog attach="fog" args={[SCENE_FOG.color, SCENE_FOG.near, SCENE_FOG.far]} />
      <ambientLight intensity={SCENE_LIGHTING.ambient} />
      <hemisphereLight
        color={SCENE_LIGHTING.hemisphereSky}
        groundColor={SCENE_LIGHTING.hemisphereGround}
        intensity={SCENE_LIGHTING.hemisphereIntensity}
        position={[0, 12, 0]}
      />
      <directionalLight
        position={[8, 14, 6]}
        intensity={SCENE_LIGHTING.keyDirectionalIntensity}
        color={SCENE_LIGHTING.keyDirectionalColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={40}
        shadow-camera-left={-(WORLD_WIDTH / 2 + 2)}
        shadow-camera-right={WORLD_WIDTH / 2 + 2}
        shadow-camera-top={WORLD_DEPTH / 2 + 2}
        shadow-camera-bottom={-(WORLD_DEPTH / 2 + 2)}
      />
      <directionalLight
        position={[-10, 11, -5]}
        intensity={SCENE_LIGHTING.fillDirectionalIntensity}
        color={SCENE_LIGHTING.fillDirectionalColor}
      />
      <pointLight
        position={[WORLD_WIDTH * 0.5, 9, WORLD_DEPTH * 0.45]}
        intensity={SCENE_LIGHTING.roomPointIntensity}
        color="#fff0e0"
        distance={34}
      />
      <VenueRoomPlaceholder />
      {interactive && placedItemsAdmin ? (
        placedItemsAdmin
      ) : (
        <PlacedItemsLayer
          items={items}
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
          selectedId={selectedId}
          reservedIds={reservedIds}
          interactive={selectable}
          onSelect={selectable ? (id) => onItemSelect?.(id) : undefined}
          pointerCursor={selectable}
        />
      )}
      {interactive ? (
        <FloorPickPlane onPointerMissed={() => onBackgroundClick?.()} />
      ) : null}
      <Environment preset="apartment" environmentIntensity={SCENE_LIGHTING.environmentIntensity} />
      <OrbitControls
        key={cameraPresetKey}
        ref={orbitControlsRef}
        makeDefault
        target={cameraPreset.target}
        enablePan={interactive || selectable}
        enableRotate={interactive || selectable}
        minDistance={cameraPreset.minDistance}
        maxDistance={cameraPreset.maxDistance}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.25}
        mouseButtons={
          interactive
            ? {
                LEFT: MOUSE.ROTATE,
                MIDDLE: MOUSE.DOLLY,
                RIGHT: MOUSE.PAN,
              }
            : undefined
        }
        touches={
          interactive
            ? {
                ONE: TOUCH.PAN,
                TWO: TOUCH.ROTATE,
              }
            : undefined
        }
      />
    </>
  );
}

export default function VenueScene3D({
  mode,
  viewBoxWidth,
  viewBoxHeight,
  items,
  selectedId,
  reservedIds,
  onSelect,
  placedItemsAdmin,
  onBackgroundClick,
  onItemSelect,
  canvasRef,
  className = "",
  viewportHeight = "min(72vh, 720px)",
  viewportMinHeight = "min(420px, 55vh)",
  layoutBucket = "laptop",
  dpr = [1, 1.5],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportAspect, setViewportAspect] = useState(16 / 9);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateAspect = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setViewportAspect(w / h);
    };

    updateAspect();
    const observer = new ResizeObserver(updateAspect);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cameraPreset = useMemo(
    () => resolveCameraPresetForAspect(layoutBucket, viewportAspect),
    [layoutBucket, viewportAspect],
  );

  const cameraPresetKey = `${layoutBucket}:${viewportAspect.toFixed(2)}:${cameraPreset.fov}`;

  const handleRef = useRef<VenueScene3DHandle>({
    getCanvas: () => null,
    getCamera: () => null,
    setOrbitEnabled: (enabled: boolean) => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = enabled;
      }
    },
  });

  const ctxValue = useMemo(
    () => ({
      getCanvas: () => handleRef.current.getCanvas(),
      setOrbitEnabled: (enabled: boolean) => handleRef.current.setOrbitEnabled(enabled),
    }),
    [],
  );

  useLayoutEffect(() => {
    if (canvasRef) {
      canvasRef.current = handleRef.current;
    }
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: viewportHeight, minHeight: viewportMinHeight }}
    >
      <VenueSceneCanvasContext.Provider value={ctxValue}>
        <Canvas
          className="block! h-full! w-full! touch-none"
          shadows="percentage"
          dpr={dpr}
          camera={{
            position: cameraPreset.position,
            fov: cameraPreset.fov,
            near: 0.1,
            far: 100,
          }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%", display: "block" }}
          onCreated={({ gl, camera }) => {
            gl.toneMappingExposure = SCENE_LIGHTING.toneMappingExposure;
            handleRef.current.getCanvas = () => gl.domElement;
            handleRef.current.getCamera = () => camera;
          }}
          onPointerMissed={() => {
            if (mode === "admin") onBackgroundClick?.();
          }}
        >
          <Suspense fallback={null}>
            <SceneContent
              mode={mode}
              viewBoxWidth={viewBoxWidth}
              viewBoxHeight={viewBoxHeight}
              items={items}
              selectedId={selectedId}
              reservedIds={reservedIds}
              onSelect={onSelect}
              placedItemsAdmin={placedItemsAdmin}
              onBackgroundClick={onBackgroundClick}
              onItemSelect={onItemSelect}
              orbitControlsRef={orbitControlsRef}
              cameraPreset={cameraPreset}
              cameraPresetKey={cameraPresetKey}
            />
          </Suspense>
        </Canvas>
      </VenueSceneCanvasContext.Provider>
    </div>
  );
}
