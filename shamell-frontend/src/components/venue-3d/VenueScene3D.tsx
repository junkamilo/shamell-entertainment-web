"use client";

import "@/lib/threeR3fCompat";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { FloorSceneZones, PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import type { LayoutItemLabel } from "@/lib/venueSeatDisplayLabel";
import { FloorSceneZonesProvider } from "./FloorSceneZonesContext";
import { mergeFloorSceneZones } from "./floorSceneZonesDefaults";
import {
  resolveAdminCameraPreset,
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
import { Color, MOUSE, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  VenueSceneCanvasContext,
  type VenueSceneCanvasContextValue,
} from "./VenueSceneCanvasContext";
import FloorPickPlane from "./FloorPickPlane";
import PlacedItemsLayer from "./PlacedItemsLayer";
import VenueRoomPlaceholder from "./VenueRoomPlaceholder";
import type { VenuePerfProfile } from "./venueScenePerformance";

export type VenueScene3DHandle = VenueSceneCanvasContextValue & {
  getCamera: () => THREE.Camera | null;
};

type Props = {
  mode: "admin" | "public" | "public-select";
  viewBoxWidth: number;
  viewBoxHeight: number;
  items: PlacedLayoutItem[];
  sceneZones?: FloorSceneZones;
  selectedId?: string | null;
  reservedIds?: Set<string>;
  reservedLabels?: ReadonlyMap<string, string>;
  itemLabels?: ReadonlyMap<string, LayoutItemLabel>;
  onSelect?: (id: string | null) => void;
  onItemSelect?: (id: string) => void;
  /** Must be used inside Canvas (uses useThree). */
  placedItemsAdmin?: React.ReactNode;
  /** Stage/carpet pick handles (admin layout editor). */
  sceneDecorAdmin?: React.ReactNode;
  onBackgroundClick?: () => void;
  canvasRef?: React.RefObject<VenueScene3DHandle | null>;
  className?: string;
  /** CSS height for the viewport (parent must be full width). */
  viewportHeight?: string;
  viewportMinHeight?: string;
  layoutBucket?: VenueSceneLayoutBucket;
  dpr?: [number, number];
  perfProfile?: VenuePerfProfile;
  /** When false, demand frameloop stops invalidating (e.g. off-screen). */
  sceneActive?: boolean;
};

type SceneContentProps = Omit<
  Props,
  "canvasRef" | "className" | "viewportHeight" | "viewportMinHeight" | "dpr"
> & {
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>;
  cameraPreset: VenueCameraPreset;
  cameraPresetKey: string;
  perfProfile: VenuePerfProfile;
  sceneActive: boolean;
};

function DeferredEnvironment({ enabled }: { enabled: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [enabled]);

  if (!enabled || !ready) return null;
  return (
    <Environment
      preset="apartment"
      environmentIntensity={SCENE_LIGHTING.environmentIntensity}
    />
  );
}

function DemandFrameInvalidator({
  selectedId,
  sceneActive,
}: {
  selectedId?: string | null;
  sceneActive: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (sceneActive) invalidate();
  }, [invalidate, sceneActive, selectedId]);

  return null;
}

function SceneContent({
  mode,
  viewBoxWidth,
  viewBoxHeight,
  items,
  sceneZones,
  selectedId,
  reservedIds,
  reservedLabels,
  itemLabels,
  placedItemsAdmin,
  sceneDecorAdmin,
  onBackgroundClick,
  onItemSelect,
  orbitControlsRef,
  cameraPreset,
  cameraPresetKey,
  perfProfile,
  sceneActive,
}: SceneContentProps) {
  const invalidate = useThree((state) => state.invalidate);
  const interactive = mode === "admin";
  const selectable = mode === "public-select";
  const useDemandLoop = selectable;
  const castShadow = perfProfile !== "mobile";
  const shadowMapSize = perfProfile === "mobile" ? 512 : 1024;

  const handleControlsChange = () => {
    if (useDemandLoop && sceneActive) invalidate();
  };

  useEffect(() => {
    if (useDemandLoop && sceneActive) invalidate();
  }, [invalidate, sceneActive, useDemandLoop, viewBoxWidth, viewBoxHeight, items.length]);

  return (
    <>
      {useDemandLoop ? (
        <DemandFrameInvalidator selectedId={selectedId} sceneActive={sceneActive} />
      ) : null}
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
        castShadow={castShadow}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
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
      {perfProfile !== "mobile" ? (
        <pointLight
          position={[WORLD_WIDTH * 0.5, 9, WORLD_DEPTH * 0.45]}
          intensity={SCENE_LIGHTING.roomPointIntensity}
          color="#fff0e0"
          distance={34}
        />
      ) : null}
      <VenueRoomPlaceholder perfProfile={perfProfile} />
      {interactive && sceneDecorAdmin ? sceneDecorAdmin : null}
      {interactive && placedItemsAdmin ? (
        placedItemsAdmin
      ) : (
        <PlacedItemsLayer
          items={items}
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
          selectedId={selectedId}
          reservedIds={reservedIds}
          reservedLabels={reservedLabels}
          itemLabels={itemLabels}
          interactive={selectable}
          onSelect={selectable ? (id) => onItemSelect?.(id) : undefined}
          pointerCursor={selectable}
          perfProfile={perfProfile}
          useInstancedChairs={false}
        />
      )}
      {interactive ? (
        <FloorPickPlane onPointerMissed={() => onBackgroundClick?.()} />
      ) : null}
      <DeferredEnvironment enabled={perfProfile !== "mobile"} />
      <OrbitControls
        key={cameraPresetKey}
        ref={orbitControlsRef}
        makeDefault
        target={cameraPreset.target}
        enablePan={interactive || selectable}
        enableRotate={(interactive || selectable) && sceneActive}
        enabled={sceneActive}
        minDistance={cameraPreset.minDistance}
        maxDistance={cameraPreset.maxDistance}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.25}
        onChange={useDemandLoop ? handleControlsChange : undefined}
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
                ONE: TOUCH.ROTATE,
                TWO: TOUCH.DOLLY_PAN,
              }
            : selectable
              ? {
                  ONE: TOUCH.ROTATE,
                  TWO: TOUCH.DOLLY_ROTATE,
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
  sceneZones,
  selectedId,
  reservedIds,
  reservedLabels,
  itemLabels,
  onSelect,
  placedItemsAdmin,
  sceneDecorAdmin,
  onBackgroundClick,
  onItemSelect,
  canvasRef,
  className = "",
  viewportHeight = "min(72vh, 720px)",
  viewportMinHeight = "min(420px, 55vh)",
  layoutBucket = "laptop",
  dpr,
  perfProfile = "high",
  sceneActive = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportAspect, setViewportAspect] = useState(16 / 9);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  const useDemandLoop = mode === "public-select";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateAspect = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setViewportAspect(w / h);
    };

    const syncViewport = () => {
      updateAspect();
      setIsNarrowViewport(el.clientWidth < 768);
    };

    syncViewport();
    const observer = new ResizeObserver(syncViewport);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const resolvedDpr =
    dpr ?? (perfProfile === "mobile" ? ([1, 1] as [number, number]) : isNarrowViewport ? [1, 1.25] : [1, 1.5]);

  const cameraPreset = useMemo(
    () =>
      mode === "admin"
        ? resolveAdminCameraPreset(viewportAspect)
        : resolveCameraPresetForAspect(layoutBucket, viewportAspect),
    [mode, layoutBucket, viewportAspect],
  );

  const cameraPresetKey = `${layoutBucket}:${viewportAspect.toFixed(2)}:${cameraPreset.fov}`;

  const resolvedSceneZones = useMemo(
    () => mergeFloorSceneZones(sceneZones),
    [sceneZones],
  );

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

  const glOptions = useMemo(
    () => ({
      antialias: perfProfile !== "mobile",
      alpha: false,
      powerPreference: (perfProfile === "mobile" ? "low-power" : "default") as WebGLPowerPreference,
    }),
    [perfProfile],
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: viewportHeight, minHeight: viewportMinHeight }}
    >
      <VenueSceneCanvasContext.Provider value={ctxValue}>
        <Canvas
          className="block! h-full! w-full! touch-none"
          shadows={perfProfile === "mobile" ? false : "percentage"}
          dpr={resolvedDpr}
          frameloop={useDemandLoop ? "demand" : "always"}
          camera={{
            position: cameraPreset.position,
            fov: cameraPreset.fov,
            near: 0.1,
            far: 100,
          }}
          gl={glOptions}
          style={{ width: "100%", height: "100%", display: "block" }}
          onCreated={({ gl, camera, scene }) => {
            gl.debug.checkShaderErrors = false;
            gl.toneMappingExposure = SCENE_LIGHTING.toneMappingExposure;
            gl.setClearColor(SCENE_BACKGROUND, 1);
            gl.domElement.style.background = SCENE_BACKGROUND;
            scene.background = new Color(SCENE_BACKGROUND);
            handleRef.current.getCanvas = () => gl.domElement;
            handleRef.current.getCamera = () => camera;
          }}
          onPointerMissed={() => {
            if (mode === "admin") onBackgroundClick?.();
          }}
        >
          <Suspense fallback={null}>
            <FloorSceneZonesProvider zones={resolvedSceneZones}>
              <SceneContent
                mode={mode}
                viewBoxWidth={viewBoxWidth}
                viewBoxHeight={viewBoxHeight}
                items={items}
                sceneZones={resolvedSceneZones}
                selectedId={selectedId}
                reservedIds={reservedIds}
                reservedLabels={reservedLabels}
                itemLabels={itemLabels}
                onSelect={onSelect}
                placedItemsAdmin={placedItemsAdmin}
                sceneDecorAdmin={sceneDecorAdmin}
                onBackgroundClick={onBackgroundClick}
                onItemSelect={onItemSelect}
                orbitControlsRef={orbitControlsRef}
                cameraPreset={cameraPreset}
                cameraPresetKey={cameraPresetKey}
                perfProfile={perfProfile}
                sceneActive={sceneActive}
              />
            </FloorSceneZonesProvider>
          </Suspense>
        </Canvas>
      </VenueSceneCanvasContext.Provider>
    </div>
  );
}
