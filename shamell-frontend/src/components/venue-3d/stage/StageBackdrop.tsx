"use client";

import { STAGE_COLORS } from "./stageMaterials";
import { BACKDROP_HEIGHT, STAGE_WIDTH } from "./stageConstants";

export default function StageBackdrop() {
  return (
    <group position={[STAGE_WIDTH / 2, BACKDROP_HEIGHT / 2, -0.06]}>
      <mesh receiveShadow>
        <boxGeometry args={[STAGE_WIDTH + 0.4, BACKDROP_HEIGHT, 0.12]} />
        <meshStandardMaterial color={STAGE_COLORS.backdrop} roughness={0.95} />
      </mesh>
      {/* Decorative red glow accents on backdrop */}
      {[0.35, 0.65].map((t, i) => (
        <mesh key={i} position={[(t - 0.5) * STAGE_WIDTH, 0.3, 0.08]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={STAGE_COLORS.wallSconce}
            emissive={STAGE_COLORS.wallSconce}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}
