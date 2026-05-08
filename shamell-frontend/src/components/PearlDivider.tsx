import { useId } from "react";
import { HERO_WAVE_MAX_BITE, heroWaveEdgeYNorm } from "@/lib/heroPearlWave";

type PearlDividerProps = {
  className?: string;
  /** Hero: bottom-edge wave + pearls aligned with clip (no floating band). */
  variant?: "hero" | "inline";
  /** Inline strand can stretch beyond the default max width. */
  fullWidth?: boolean;
};

const HeroPearlStrand = ({ className = "" }: { className?: string }) => {
  const uid = useId().replace(/:/g, "");
  const faceId = `pearl-face-${uid}`;
  const faceAccentId = `pearl-face-accent-${uid}`;
  const glowId = `pearl-soft-glow-${uid}`;
  const strandId = `pearl-strand-${uid}`;

  const viewW = 1600;
  /** Short strip pinned to hero bottom; y grows downward, pearls sit on wave */
  const viewH = 36;
  const yBottom = 31.5;
  const yTravel = 21;
  const xPad = 2;
  const n = 148;
  const centerIdx = Math.floor((n - 1) / 2);

  const pearlY = (waveYNorm: number) => {
    const bite = 1 - waveYNorm;
    const t = Math.min(1, bite / HERO_WAVE_MAX_BITE);
    return yBottom - t * yTravel;
  };

  const pathD = (() => {
    const steps = 200;
    let d = "";
    for (let s = 0; s <= steps; s++) {
      const tx = s / steps;
      const px = xPad + tx * (viewW - 2 * xPad);
      const heroXNorm = xPad / viewW + tx * ((viewW - 2 * xPad) / viewW);
      const py = pearlY(heroWaveEdgeYNorm(heroXNorm));
      d += (s === 0 ? "M " : " L ") + `${px.toFixed(3)},${py.toFixed(3)}`;
    }
    return d;
  })();

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[min(5.25rem,10.5svh)] ${className}`}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="h-full w-full text-gold-light"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          <radialGradient id={faceId} cx="38%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="42%" stopColor="#FAF6EE" />
            <stop offset="82%" stopColor="#EBDFCC" />
            <stop offset="100%" stopColor="#D4C4A8" />
          </radialGradient>
          <radialGradient id={faceAccentId} cx="34%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FFF9EE" />
            <stop offset="72%" stopColor="#EDDDB8" />
            <stop offset="100%" stopColor="#D4B890" />
          </radialGradient>
          <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={strandId} x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="0.65" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={pathD}
          fill="none"
          stroke="rgba(245,232,210,0.38)"
          strokeWidth={1.15}
          strokeLinecap="round"
          filter={`url(#${strandId})`}
        />
        <path
          d={pathD}
          fill="none"
          stroke="rgba(210,185,140,0.32)"
          strokeWidth={0.55}
          strokeLinecap="round"
        />

        {Array.from({ length: n }, (_, i) => {
          const t = i / (n - 1);
          const x = xPad + t * (viewW - 2 * xPad);
          const heroXNorm =
            xPad / viewW + t * ((viewW - 2 * xPad) / viewW);
          const waveNorm = heroWaveEdgeYNorm(heroXNorm);
          const y = pearlY(waveNorm);
          const isCenter = i === centerIdx;
          const r = isCenter ? 3.85 : 1.65;
          const fill = isCenter ? `url(#${faceAccentId})` : `url(#${faceId})`;
          const opacity = isCenter ? 1 : 0.93;

          return (
            <g key={i} filter={isCenter ? `url(#${glowId})` : undefined}>
              <circle
                cx={Number(x.toFixed(4))}
                cy={Number(y.toFixed(4))}
                r={Number(r.toFixed(3))}
                fill={fill}
                opacity={opacity}
              />
              {!isCenter && (
                <circle
                  cx={Number((x - r * 0.32).toFixed(4))}
                  cy={Number((y - r * 0.34).toFixed(4))}
                  r={Number((r * 0.22).toFixed(3))}
                  fill="#FFFFFF"
                  opacity={0.5}
                />
              )}
              {isCenter && (
                <circle
                  cx={Number((x - r * 0.34).toFixed(4))}
                  cy={Number((y - r * 0.36).toFixed(4))}
                  r={Number((r * 0.2).toFixed(3))}
                  fill="#FFFFFF"
                  opacity={0.58}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const InlinePearlStrand = ({
  className = "",
  fullWidth = false,
}: {
  className?: string;
  fullWidth?: boolean;
}) => {
  const uid = useId().replace(/:/g, "");
  const faceId = `pearl-face-${uid}`;
  const faceAccentId = `pearl-face-accent-${uid}`;
  const glowId = `pearl-soft-glow-${uid}`;

  const viewW = 1600;
  const viewH = 96;
  const n = 72;
  const xPad = 8;
  const yTop = 12;

  const sagDepth = 44;

  const cx = (i: number) => xPad + (i / (n - 1)) * (viewW - 2 * xPad);

  const cy = (i: number) => {
    const t = i / (n - 1);
    const u = t * 2 - 1;
    const sag = sagDepth * (1 - u * u);
    return yTop + sag;
  };

  const centerIdx = Math.floor((n - 1) / 2);

  return (
    <div
      className={`relative flex w-full items-center justify-center py-2 sm:py-3 ${className}`}
    >
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className={`h-auto w-full text-gold-light ${fullWidth ? "max-w-none" : "max-w-4xl"}`}
        style={{ aspectRatio: `${viewW} / ${viewH}` }}
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
        aria-hidden
      >
        <defs>
          <radialGradient id={faceId} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFBF2" />
            <stop offset="45%" stopColor="#F0E4C8" />
            <stop offset="100%" stopColor="#C5A55A" />
          </radialGradient>
          <radialGradient id={faceAccentId} cx="32%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FFFDF8" />
            <stop offset="40%" stopColor="#F5E8CC" />
            <stop offset="100%" stopColor="#D4B978" />
          </radialGradient>
          <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: n }, (_, i) => {
          const x = cx(i);
          const y = cy(i);
          const isCenter = i === centerIdx;
          const micro =
            1 +
            0.08 * Math.sin(i * 2.17) +
            0.06 * Math.sin(i * 5.03 + 1.2);
          const r = isCenter ? 5.5 : 2 * micro;
          const fill = isCenter ? `url(#${faceAccentId})` : `url(#${faceId})`;
          const opacity = isCenter ? 1 : 0.82 + 0.12 * Math.sin(i * 1.3);

          return (
            <g key={i} filter={isCenter ? `url(#${glowId})` : undefined}>
              <circle
                cx={Number(x.toFixed(4))}
                cy={Number(y.toFixed(4))}
                r={Number(r.toFixed(3))}
                fill={fill}
                opacity={opacity}
              />
              {!isCenter && (
                <circle
                  cx={Number((x - r * 0.28).toFixed(4))}
                  cy={Number((y - r * 0.32).toFixed(4))}
                  r={Number((r * 0.28).toFixed(3))}
                  fill="#FFFCF5"
                  opacity={0.42}
                />
              )}
              {isCenter && (
                <circle
                  cx={Number((x - r * 0.32).toFixed(4))}
                  cy={Number((y - r * 0.34).toFixed(4))}
                  r={Number((r * 0.22).toFixed(3))}
                  fill="#FFFCF5"
                  opacity={0.55}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Decorative pearl strand: hero uses bottom strip + many small pearls; inline is compact.
 */
const PearlDivider = ({
  className = "",
  variant = "inline",
  fullWidth = false,
}: PearlDividerProps) => {
  if (variant === "hero") {
    return <HeroPearlStrand className={className} />;
  }
  return <InlinePearlStrand className={className} fullWidth={fullWidth} />;
};

export default PearlDivider;
