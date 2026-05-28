"use client";

import { Bell } from "lucide-react";

type Props = {
  count: number;
  collapsed?: boolean;
  className?: string;
};

export default function AdminNavNotification({ count, collapsed = false, className = "" }: Props) {
  if (count <= 0) return null;

  if (collapsed) {
    return <span className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-shamell-fire ${className}`} />;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-shamell-fire/60 bg-shamell-fire/20 px-1.5 py-0.5 text-[10px] font-semibold text-shamell-fire ${className}`}
      aria-label={`${count} new notifications`}
    >
      <Bell className="h-3 w-3" strokeWidth={1.8} />
      <span className="leading-none text-white">{count > 99 ? "99+" : count}</span>
    </span>
  );
}

