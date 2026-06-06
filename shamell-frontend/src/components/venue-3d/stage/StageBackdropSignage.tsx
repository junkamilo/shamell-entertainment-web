"use client";

import { useTexture } from "@react-three/drei";
import { useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { BACKDROP_HEIGHT, STAGE_WIDTH } from "./stageConstants";

const SHAMELL_LOGO_SRC = "/01_bailarina.png";
const LOGO_ASPECT = 180 / 164;

function createWordmarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '600 76px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = "#d4af55";
  ctx.shadowColor = "rgba(201, 162, 39, 0.85)";
  ctx.shadowBlur = 22;
  ctx.fillText("shamell", canvas.width / 2, canvas.height / 2 + 4);
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Brand mark on the stage backdrop (local space: faces +Z toward the room).
 * Uses only WebGL meshes (no Html portal) so admin toolbar stays clickable.
 */
export default function StageBackdropSignage() {
  const logoTextureSource = useTexture(SHAMELL_LOGO_SRC);
  const logoTexture = useMemo(() => {
    const texture = logoTextureSource.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [logoTextureSource]);

  const [wordmarkTexture, setWordmarkTexture] = useState<THREE.CanvasTexture | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let texture: THREE.CanvasTexture | null = null;

    const build = () => {
      if (cancelled) return;
      texture = createWordmarkTexture();
      setWordmarkTexture(texture);
    };

    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(build);
    } else {
      build();
    }

    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, []);

  const backdropW = STAGE_WIDTH + 0.4;
  const backdropH = BACKDROP_HEIGHT;

  const { logoW, logoH, logoY, wordY, wordW, wordH } = useMemo(() => {
    const maxLogoH = backdropH * 0.74;
    const maxLogoW = backdropW * 0.9;
    let h = maxLogoH;
    let w = h * LOGO_ASPECT;
    if (w > maxLogoW) {
      w = maxLogoW;
      h = w / LOGO_ASPECT;
    }
    const ww = backdropW * 0.82;
    const wh = backdropH * 0.14;
    return {
      logoW: w,
      logoH: h,
      logoY: backdropH * 0.1,
      wordY: -backdropH * 0.36,
      wordW: ww,
      wordH: wh,
    };
  }, [backdropH, backdropW]);

  return (
    <group position={[0, 0, 0.066]}>
      <mesh position={[0, logoY, 0]}>
        <planeGeometry args={[logoW, logoH]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, logoY, -0.001]}>
        <planeGeometry args={[logoW * 1.08, logoH * 1.08]} />
        <meshBasicMaterial
          color="#c9a227"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {wordmarkTexture ? (
        <mesh position={[0, wordY, 0.001]}>
          <planeGeometry args={[wordW, wordH]} />
          <meshBasicMaterial
            map={wordmarkTexture}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
