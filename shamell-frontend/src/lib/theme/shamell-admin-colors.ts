/**
 * SHAMELL ADMIN — Purple Fire hex literals
 *
 * Use only where CSS variables are unavailable (charts, canvas, SVG from JS).
 */

export const SHAMELL_ADMIN_COLORS = {
  night: "#1F0A2E",
  twilight: "#2D1240",
  dusk: "#4A1F3A",
  ember: "#7A2828",
  fire: "#B8381E",
  flame: "#E8842F",

  fireRed: "#D63E2C",
  fireOrange: "#E8842F",
  fireYellow: "#F5C53D",

  gold: "#D4B568",
  goldBright: "#E8C97A",
  goldDeep: "#A88E45",

  textPrimary: "#F5E0D0",

  danger: "#C9001F",
  success: "#4A8B5C",
  warning: "#E8842F",
} as const;

export const SHAMELL_COLORS = SHAMELL_ADMIN_COLORS;

export type ShamellAdminColorKey = keyof typeof SHAMELL_ADMIN_COLORS;

export const SHAMELL_ADMIN_PALETTES = {
  fireRamp: [
    SHAMELL_ADMIN_COLORS.twilight,
    SHAMELL_ADMIN_COLORS.dusk,
    SHAMELL_ADMIN_COLORS.ember,
    SHAMELL_ADMIN_COLORS.fire,
    SHAMELL_ADMIN_COLORS.fireOrange,
    SHAMELL_ADMIN_COLORS.fireYellow,
  ],
  categorical: [
    SHAMELL_ADMIN_COLORS.gold,
    SHAMELL_ADMIN_COLORS.fireRed,
    SHAMELL_ADMIN_COLORS.fireOrange,
    SHAMELL_ADMIN_COLORS.dusk,
    SHAMELL_ADMIN_COLORS.fireYellow,
    SHAMELL_ADMIN_COLORS.ember,
  ],
} as const;

export const SHAMELL_PALETTES = SHAMELL_ADMIN_PALETTES;
