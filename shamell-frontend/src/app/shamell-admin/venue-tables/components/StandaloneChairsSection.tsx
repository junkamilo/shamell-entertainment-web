"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { ON_COMING_EVENTS_LAYOUT_ADMIN_PATH } from "@/lib/onComingEventsRoutes";
import { formatPriceEn, parsePriceInput } from "../lib/parseVenueTablePrice";
import { formatStandaloneChairAdminSubtitle } from "../lib/mapStandaloneChairFromApi";
import { useStandaloneChairsConfig } from "../hooks/useStandaloneChairsConfig";
import { STANDALONE_CHAIR_DISPLAY_LABEL } from "../types/standaloneChairs.types";

export default function StandaloneChairsSection() {
  const cfg = useStandaloneChairsConfig();
  const pricePreview = parsePriceInput(cfg.unitPriceInput);

  if (cfg.loading) {
    return (
      <section className="rounded-xl border border-shamell-line-soft bg-shamell-twilight/20 p-6 text-sm text-shamell-text-primary/70">
        Loading standalone chair configuration…
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-shamell-line-soft bg-shamell-twilight/25 p-6">
      <div className="mb-4">
        <p className="text-sm text-shamell-text-primary/75">
          Chairs placed on the On Coming Events floor plan that are not part of a table combo. Set how
          many are available and the unit price per chair.
        </p>
        <p className="mt-2 text-xs text-shamell-gold">
          Each chair receives a unique internal ID automatically (like tables). You will
          see only &quot;{STANDALONE_CHAIR_DISPLAY_LABEL}&quot; in lists and reservations.
        </p>
        <p className="mt-2 text-xs text-shamell-gold">
          Place them in{" "}
          <Link href={ON_COMING_EVENTS_LAYOUT_ADMIN_PATH} className="underline hover:text-shamell-text-primary">
            On Coming Events
          </Link>{" "}
          using the chair item from the palette.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-shamell-gold">
            Available quantity
          </label>
          <p className="mb-2 text-[11px] text-shamell-text-primary/70">
            How many standalone chairs can be offered (not tied to a table).
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!cfg.canDecrementQuantity}
              onClick={cfg.decrementQuantity}
              className="rounded-lg border border-shamell-line-soft p-2 text-shamell-text-primary disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={0}
              max={500}
              value={cfg.availableQuantity}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) {
                  cfg.setAvailableQuantity(Math.min(500, Math.max(0, n)));
                }
              }}
              className="w-24 rounded-lg border border-shamell-line-soft bg-shamell-night/40 px-3 py-2 text-center text-sm text-shamell-text-primary"
            />
            <button
              type="button"
              disabled={!cfg.canIncrementQuantity}
              onClick={cfg.incrementQuantity}
              className="rounded-lg border border-shamell-line-soft p-2 text-shamell-text-primary disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-shamell-gold">
            Unit price (each chair)
          </label>
          <p className="mb-2 text-[11px] text-shamell-text-primary/70">
            Price per standalone chair when booked or quoted separately from tables.
          </p>
          <input
            type="text"
            inputMode="decimal"
            value={cfg.unitPriceInput}
            onChange={(e) => cfg.setUnitPriceInput(e.target.value)}
            placeholder="150"
            className="w-full rounded-lg border border-shamell-line-soft bg-shamell-night/40 px-3 py-2 text-sm text-shamell-text-primary"
          />
          <p className="mt-1 text-xs text-shamell-gold">
            {pricePreview.ok && pricePreview.value != null
              ? `${formatPriceEn(pricePreview.value)} each`
              : cfg.availableQuantity > 0
                ? "Enter a valid amount"
                : "Optional when quantity is 0"}
          </p>
        </div>
      </div>

      {cfg.chairs.length > 0 ? (
        <div className="mt-6 rounded-lg border border-shamell-line-soft/80 bg-black/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-shamell-gold">
            Inventory ({cfg.chairs.length})
          </p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs text-shamell-text-primary/85">
            {cfg.chairs.slice(0, 20).map((chair) => (
              <li
                key={chair.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-shamell-line-soft/50 px-2 py-1.5"
              >
                <span className="font-semibold text-shamell-text-primary">
                  {chair.displayLabel}
                </span>
                <span className="text-shamell-text-primary/65">
                  {formatStandaloneChairAdminSubtitle(chair)}
                </span>
              </li>
            ))}
            {cfg.chairs.length > 20 ? (
              <li className="text-shamell-text-primary/60">
                +{cfg.chairs.length - 20} more chairs
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {cfg.fieldErrors.length > 0 ? (
        <ul className="mt-3 text-xs text-shamell-danger">
          {cfg.fieldErrors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={cfg.saving}
          onClick={() => void cfg.save()}
          className="rounded-lg bg-shamell-fire px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {cfg.saving ? "Saving…" : "Save standalone chairs"}
        </button>
      </div>
    </section>
  );
}
