import { CalendarDays, Star, Image, FileText } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
}

const defaultStats: Stat[] = [
  { label: "Reservas Activas", value: 0, icon: CalendarDays, change: "+0 este mes" },
  { label: "Testimonios Pendientes", value: 0, icon: Star, change: "Por aprobar" },
  { label: "Fotos en Galería", value: 0, icon: Image, change: "Publicadas" },
  { label: "Posts del Blog", value: 0, icon: FileText, change: "Publicados" },
];

interface DashboardStatsProps {
  stats?: Stat[];
}

const DashboardStats = ({ stats = defaultStats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-gold/10 p-6 flex flex-col gap-3 hover:border-gold/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <p className="text-foreground/50 text-xs font-body tracking-wide">{stat.label}</p>
            <stat.icon className="w-4 h-4 text-gold/60 stroke-[1.2]" />
          </div>
          <p className="font-brand text-gold text-3xl">{stat.value}</p>
          {stat.change && (
            <p className="text-foreground/30 text-[10px] font-body">{stat.change}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
