import { Instagram, Youtube, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-gold/10 py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-foreground/50 text-xs font-body tracking-wide">
          Copyright SHAMELL &copy; {new Date().getFullYear()}
        </p>

        <a
          href="#inquire"
          className="text-gold text-xs font-brand tracking-widest hover:text-gold-light transition-colors"
        >
          Inquire
        </a>

        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/Shamellentertainment"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/70 hover:text-gold transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/70 hover:text-gold transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="w-4 h-4" />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/70 hover:text-gold transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <span className="text-gold/50 text-sm">✦</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
