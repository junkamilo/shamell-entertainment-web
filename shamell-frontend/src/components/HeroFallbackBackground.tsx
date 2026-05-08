"use client";

export default function HeroFallbackBackground() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070707]" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_12%,rgba(197,165,90,0.35)_0%,rgba(18,18,18,0.1)_48%,rgba(5,5,5,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_18%_92%,rgba(197,165,90,0.18)_0%,transparent_68%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_85%_90%,rgba(197,165,90,0.12)_0%,transparent_72%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_38%,rgba(197,165,90,0.06)_100%)]" />

      <div className="absolute left-0 top-[18%] h-px w-full bg-linear-to-r from-transparent via-gold/35 to-transparent" />
      <div className="absolute left-0 top-[58%] h-px w-full bg-linear-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute top-0 h-full w-px bg-linear-to-b from-transparent via-gold/30 to-transparent" style={{ left: "18%" }} />
      <div className="absolute top-0 h-full w-px bg-linear-to-b from-transparent via-gold/24 to-transparent" style={{ left: "78%" }} />
    </div>
  );
}
