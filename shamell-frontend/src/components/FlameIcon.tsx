const FlameIcon = ({ className = "w-12 h-16" }: { className?: string }) => (
    <svg viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M20 0C20 0 8 18 8 32C8 38.6274 13.3726 44 20 44C26.6274 44 32 38.6274 32 32C32 18 20 0 20 0Z"
        fill="url(#flame-grad)"
      />
      <path
        d="M20 16C20 16 14 28 14 35C14 38.3137 16.6863 41 20 41C23.3137 41 26 38.3137 26 35C26 28 20 16 20 16Z"
        fill="url(#flame-inner)"
        opacity="0.7"
      />
      <defs>
        <linearGradient id="flame-grad" x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="0.5" stopColor="#C5A55A" />
          <stop offset="1" stopColor="#8B7332" />
        </linearGradient>
        <linearGradient id="flame-inner" x1="20" y1="16" x2="20" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5E6B8" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
    </svg>
  );
  
  export default FlameIcon;
  