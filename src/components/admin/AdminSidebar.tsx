'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Image,
  FileText,
  Star,
  BarChart2,
  Settings,
  BookOpen,
} from "lucide-react";
import FlameIcon from "@/components/public/FlameIcon";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Reservas", href: "/admin/reservas", icon: BookOpen },
  { label: "Calendario", href: "/admin/calendario", icon: CalendarDays },
  { label: "Galería", href: "/admin/contenido/galeria", icon: Image },
  { label: "Blog", href: "/admin/blog", icon: FileText },
  { label: "Testimonios", href: "/admin/testimonios", icon: Star },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-card border-r border-gold/10 flex flex-col z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gold/10">
        <FlameIcon className="w-5 h-7" />
        <div>
          <p className="font-brand text-gold text-xs tracking-[0.2em]">SHAMELL</p>
          <p className="text-foreground/40 text-[10px] font-body tracking-wide">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-xs font-brand tracking-widest transition-colors ${
                active
                  ? "text-gold bg-gold/5 border-r-2 border-gold"
                  : "text-foreground/50 hover:text-gold hover:bg-gold/5"
              }`}
            >
              <Icon className="w-4 h-4 stroke-[1.2]" />
              {label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-gold/10">
        <Link
          href="/"
          className="text-foreground/40 text-[10px] font-body tracking-wide hover:text-gold transition-colors"
        >
          ← View Site
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
