'use client';

import { Bell, LogOut } from "lucide-react";

interface AdminHeaderProps {
  title: string;
}

const AdminHeader = ({ title }: AdminHeaderProps) => {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-gold/10 bg-card">
      <h1 className="font-brand text-gold text-sm tracking-[0.2em]">
        {title.toUpperCase()}
      </h1>
      <div className="flex items-center gap-4">
        <button
          className="text-foreground/50 hover:text-gold transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          className="text-foreground/50 hover:text-gold transition-colors flex items-center gap-2 font-brand text-[10px] tracking-widest"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">LOGOUT</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
