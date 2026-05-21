export default function SectionGoldDivider() {
  return (
    <div className="relative my-8 flex items-center justify-center" aria-hidden>
      <div className="h-px w-full max-w-xl bg-linear-to-r from-transparent via-gold/25 to-transparent" />
      <div className="absolute h-2 w-2 rotate-45 border border-gold/35 bg-black/40" />
    </div>
  );
}
