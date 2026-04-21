import Link from "next/link";
import FlameIcon from "@/components/public/FlameIcon";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
      <FlameIcon className="w-10 h-14 mb-6 opacity-40" />
      <h1 className="font-brand text-gold text-6xl tracking-widest mb-4">404</h1>
      <p className="font-elegant italic text-foreground/60 text-xl mb-8">
        This page does not exist.
      </p>
      <Link href="/" className="btn-outline-gold font-brand text-xs">
        Return Home
      </Link>
    </div>
  );
}
