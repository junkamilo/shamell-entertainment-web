"use client";

import { AccordionSingleSelect } from "@/components/admin/inputs";
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

const styleControlLabelClass =
  "font-brand text-[10px] tracking-[0.16em] text-gold/75";

/** Matches text inputs and pairs with compact font select in this form. */
const styleControlRowHeightClass = "h-11 min-h-11";

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

      <div className="space-y-1.5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={styleControlLabelClass}>FONT</span>
            <AccordionSingleSelect
              options={FONT_SELECT_OPTIONS}
              value={font}
              onChange={(id) => onFontChange(id as HeaderFontToken)}
              showNoneOption={false}
              required
              ariaLabel={`${label} font`}
              className="[&_button]:min-h-11 [&_button]:py-2.5 [&_button]:text-sm"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={styleControlLabelClass}>COLOR</span>
            <div
              className={cn(
                "flex items-stretch gap-2",
                styleControlRowHeightClass,
              )}
            >
              <div className="relative h-full w-12 shrink-0">
                <input
                  type="color"
                  value={colorInputFromHex(color)}
                  onChange={(event) =>
                    onColorChange(hexFromColorInput(event.target.value))
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={`${label} color picker`}
                />
                <div
                  className="shamell-glass-trigger flex h-full w-full items-center justify-center rounded-xl border border-gold/30 p-1"
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
                onChange={(event) =>
                  onColorChange(normalizeHexColor(event.target.value))
                }
                placeholder="#RRGGBB"
                className={cn(
                  fieldInputClass,
                  styleControlRowHeightClass,
                  "min-w-0 flex-1 font-mono",
                )}
              />
            </div>
          </div>
        </div>
        {colorInvalid ? (
          <p className="text-[11px] text-destructive sm:text-right">
            Use format #RRGGBB
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
