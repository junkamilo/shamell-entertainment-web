"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import AdminNavNotification from "@/components/admin/AdminNavNotification";
import {
  type AdminNavGroupItem,
  type AdminNavLinkItem,
  isAdminNavGroupActive,
  isAdminNavLinkActive,
  UPCOMING_EVENTS_NAV_EXPANDED_KEY,
} from "@/components/admin/adminNavConfig";

type Props = {
  group: AdminNavGroupItem;
  pathname: string;
  sidebarCollapsed: boolean;
  reservationsBadgeCount: number;
  onNavigate: () => void;
};

function NavChildLink({
  item,
  pathname,
  sidebarCollapsed,
  reservationsBadgeCount,
  onNavigate,
  indent = true,
}: {
  item: AdminNavLinkItem;
  pathname: string;
  sidebarCollapsed: boolean;
  reservationsBadgeCount: number;
  onNavigate: () => void;
  indent?: boolean;
}) {
  const active = isAdminNavLinkActive(pathname, item.href);
  const Icon = item.icon;
  const showBadge = item.badge === "reservations" && reservationsBadgeCount > 0;

  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onNavigate}
      className={`relative flex items-center rounded-md py-2 font-brand text-[11px] tracking-[0.12em] transition-colors ${
        indent ? "pl-9 pr-3" : "px-3"
      } ${
        active
          ? "border border-gold/35 bg-gold/15 text-gold"
          : "border border-transparent text-foreground/70 hover:border-gold/20 hover:bg-gold/5 hover:text-gold"
      } ${sidebarCollapsed ? "justify-center gap-0 px-2" : "gap-3"}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 opacity-90 ${sidebarCollapsed ? "mx-auto" : ""}`}
        strokeWidth={1.5}
      />
      {!sidebarCollapsed ? (
        <span className="flex min-w-0 items-center gap-2">
          <span>{item.label.toUpperCase()}</span>
          {showBadge ? <AdminNavNotification count={reservationsBadgeCount} /> : null}
        </span>
      ) : showBadge ? (
        <AdminNavNotification count={reservationsBadgeCount} collapsed />
      ) : null}
    </Link>
  );
}

export default function AdminNavGroup({
  group,
  pathname,
  sidebarCollapsed,
  reservationsBadgeCount,
  onNavigate,
}: Props) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const groupActive = isAdminNavGroupActive(pathname, group);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [expanded, setExpanded] = useState(groupActive);

  const readStoredExpanded = useCallback((): boolean | null => {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(UPCOMING_EVENTS_NAV_EXPANDED_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  }, []);

  useEffect(() => {
    const stored = readStoredExpanded();
    if (stored !== null) {
      setExpanded(stored);
      return;
    }
    if (groupActive) {
      setExpanded(true);
    }
  }, [groupActive, readStoredExpanded]);

  useEffect(() => {
    if (!flyoutOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setFlyoutOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFlyoutOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [flyoutOpen]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      sessionStorage.setItem(UPCOMING_EVENTS_NAV_EXPANDED_KEY, String(next));
      return next;
    });
  };

  const GroupIcon = group.icon;
  const headerActiveClass = groupActive
    ? "border-gold/35 bg-gold/15 text-gold"
    : "border-transparent text-foreground/70 hover:border-gold/20 hover:bg-gold/5 hover:text-gold";

  if (sidebarCollapsed) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          title={group.label}
          aria-expanded={flyoutOpen}
          aria-haspopup="menu"
          onClick={() => setFlyoutOpen((open) => !open)}
          className={`relative flex w-full items-center justify-center rounded-md border px-2 py-2.5 transition-colors ${headerActiveClass}`}
        >
          <GroupIcon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.5} />
          {reservationsBadgeCount > 0 ? (
            <AdminNavNotification count={reservationsBadgeCount} collapsed />
          ) : null}
        </button>

        {flyoutOpen ? (
          <div
            role="menu"
            className="absolute left-full top-0 z-[60] ml-1 min-w-[14rem] max-w-[min(100vw-5rem,16rem)] rounded-lg border border-gold/30 bg-[#0b0f14] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          >
            <p className="border-b border-gold/15 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold/80">
              {group.label.toUpperCase()}
            </p>
            {group.children.map((child) => (
              <div key={child.href} role="none" className="px-1 py-0.5">
                <NavChildLink
                  item={child}
                  pathname={pathname}
                  sidebarCollapsed={false}
                  reservationsBadgeCount={reservationsBadgeCount}
                  onNavigate={() => {
                    setFlyoutOpen(false);
                    onNavigate();
                  }}
                  indent={false}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggleExpanded}
        className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 font-brand text-[11px] tracking-[0.12em] transition-colors ${headerActiveClass}`}
      >
        <GroupIcon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.5} />
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span>{group.label.toUpperCase()}</span>
          {reservationsBadgeCount > 0 ? (
            <AdminNavNotification count={reservationsBadgeCount} />
          ) : null}
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.5} />
        )}
      </button>

      {expanded ? (
        <div id={panelId} className="flex flex-col gap-0.5 border-l border-gold/15 ml-3 pl-1">
          {group.children.map((child) => (
            <NavChildLink
              key={child.href}
              item={child}
              pathname={pathname}
              sidebarCollapsed={false}
              reservationsBadgeCount={reservationsBadgeCount}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
