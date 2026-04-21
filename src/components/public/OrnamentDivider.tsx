const OrnamentDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-3 py-6 ${className}`}>
    <div className="w-16 h-px bg-gold opacity-40" />
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold opacity-60" fill="currentColor">
      <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" />
    </svg>
    <div className="flex gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-gold opacity-50" />
      <div className="w-1.5 h-1.5 rounded-full bg-gold opacity-70" />
      <div className="w-1.5 h-1.5 rounded-full bg-gold opacity-50" />
    </div>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold opacity-60" fill="currentColor">
      <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" />
    </svg>
    <div className="w-16 h-px bg-gold opacity-40" />
  </div>
);

export default OrnamentDivider;
