import Link from "next/link";
import FlameIcon from "./FlameIcon";

interface NavBarProps {
  currentTitle?: string;
}

const navLinks = [
  { label: "Private Galas", path: "/servicios/private-galas" },
  { label: "VIP Events", path: "/servicios/vip-events" },
  { label: "Bespoke Collaborations", path: "/servicios/bespoke-collaborations" },
];

const NavBar = ({ currentTitle }: NavBarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-gold/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <FlameIcon className="w-5 h-7" />
          <span className="font-brand text-gold text-xs tracking-[0.2em] hidden sm:inline">
            SHAMELL
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`font-brand text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] transition-colors px-1 sm:px-2 py-1 ${
                link.label === currentTitle
                  ? "text-gold"
                  : "text-foreground/50 hover:text-gold"
              }`}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
