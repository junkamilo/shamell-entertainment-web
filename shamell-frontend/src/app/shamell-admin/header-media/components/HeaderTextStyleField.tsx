"use client";

import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import type { HeaderFontToken } from "@/lib/headerTextTypes";
import { HEADER_FONT_OPTIONS } from "@/lib/headerTextTypes";
import {
  colorInputFromHex,
  hexFromColorInput,
  isValidHexColor,
  normalizeHexColor,
} from "@/lib/headerTextStyleTokens";
import { cn } from "@/lib/utils";

const FONT_SELECT_OPTIONS = HEADER_FONT_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
}));

const fieldInputClass =
  "shamell-glass-trigger w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/25";

type Props = {
  label: string;
  text: string;
  onTextChange: (value: string) => void;
  font: HeaderFontToken;
  onFontChange: (value: HeaderFontToken) => void;
  color: string;
  onColorChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
};

export default function HeaderTextStyleField({
  label,
  text,
  onTextChange,
  font,
  onFontChange,
  color,
  onColorChange,
  multiline = false,
  rows = 3,
}: Props) {
  const colorInvalid = !isValidHexColor(color);

  return (
    <fieldset className="space-y-3 rounded-xl border border-gold/15 bg-black/15 p-4">
      <legend className="px-1 font-brand text-[11px] tracking-[0.2em] text-gold/95">
        {label}
      </legend>

      {multiline ? (
        <textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          rows={rows}
          className={cn(fieldInputClass, "py-3")}
        />
      ) : (
        <input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          className={cn(fieldInputClass, "h-11")}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-brand text-[10px] tracking-[0.16em] text-gold/75">FONT</span>
          <div className="mt-1.5">
            <AdminAccordionSingleSelect
              options={FONT_SELECT_OPTIONS}
              value={font}
              onChange={(id) => onFontChange(id as HeaderFontToken)}
              showNoneOption={false}
              required
              ariaLabel={`${label} font`}
            />
          </div>
        </label>

        <label className="block">
          <span className="font-brand text-[10px] tracking-[0.16em] text-gold/75">COLOR</span>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative shrink-0">
              <input
                type="color"
                value={colorInputFromHex(color)}
                onChange={(event) => onColorChange(hexFromColorInput(event.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label={`${label} color picker`}
              />
              <div
                className="shamell-glass-trigger flex h-10 w-12 items-center justify-center rounded-lg border border-gold/30 p-1"
                aria-hidden
              >
                <span
                  className="h-full w-full rounded-md border border-white/10 shadow-inner"
                  style={{ backgroundColor: colorInputFromHex(color) }}
                />
              </div>
            </div>
            <input
              value={color}
              onChange={(event) => onColorChange(normalizeHexColor(event.target.value))}
              placeholder="#RRGGBB"
              className={cn(fieldInputClass, "h-10 min-w-0 flex-1 font-mono")}
            />
          </div>
          {colorInvalid ? (
            <p className="mt-1 text-[11px] text-destructive">Use format #RRGGBB</p>
          ) : null}
        </label>
      </div>
    </fieldset>
  );
}
