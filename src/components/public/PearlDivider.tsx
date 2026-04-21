const PearlDivider = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-full flex items-center justify-center py-4 ${className}`}>
      <svg
        viewBox="0 0 800 60"
        className="w-full max-w-4xl h-auto pearl-shimmer"
        preserveAspectRatio="xMidYMid meet"
      >
        {Array.from({ length: 61 }, (_, i) => {
          const t = i / 60;
          const x = 20 + t * 760;
          const sag = Math.sin(t * Math.PI) * 30;
          const y = 5 + sag;
          const r = i === 30 ? 5 : 2;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={i === 30 ? "#F5E6B8" : "#C5A55A"}
              opacity={i === 30 ? 1 : 0.7}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default PearlDivider;
