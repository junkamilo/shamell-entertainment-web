import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Bell,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Info,
  LayoutGrid,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Shapes,
  Store,
  Tags,
  Ticket,
  UserPlus,
  X,
} from "lucide-react";

/**
 * Stable admin icon type. Today Lucide; swap implementations here when custom SVGs land.
 */
export type AdminIcon = LucideIcon;

/** Nav / domain icons */
export const NavAgendaIcon = CalendarDays;
export const NavHeaderMediaIcon = ImageIcon;
export const NavServiceTypesIcon = Shapes;
export const NavServicesIcon = Package;
export const NavOccasionTypesIcon = ClipboardList;
export const NavEventTypesIcon = Tags;
export const NavEventsIcon = CalendarRange;
export const NavGalleryCategoriesIcon = PanelsTopLeft;
export const NavGalleryIcon = ImageIcon;
export const NavUpcomingEventsIcon = LayoutGrid;
export const NavSeatingLayoutIcon = LayoutGrid;
export const NavOnComingEventsSiteIcon = Store;
export const NavSeatReservationsIcon = Ticket;
export const NavTableSeatingIcon = Armchair;
export const NavAboutIcon = Info;
export const NavAddAdminIcon = UserPlus;

/** Shell chrome */
export const ShellMenuIcon = Menu;
export const ShellSidebarCollapseIcon = PanelLeftClose;
export const ShellSidebarExpandIcon = PanelLeftOpen;
export const ShellCloseIcon = X;
export const ShellExternalLinkIcon = ExternalLink;
export const ShellViewSiteIcon = Store;
export const ShellBellIcon = Bell;
