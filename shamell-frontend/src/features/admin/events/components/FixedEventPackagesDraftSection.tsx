"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  TableRowActions,
  tableIconBtnClass,
  tableIconBtnDangerClass,
} from "@/components/admin/data-display";
import type {
  EventActivityForm,
  FixedEventPackageForm,
} from "@/features/admin/on-coming-events/fixed-packages/types/fixedEventPackage.types";
import { FixedEventPackageModal } from "./FixedEventPackageModal";

type Props = {
  activities: EventActivityForm[];
  draftPackages: FixedEventPackageForm[];
  onDraftPackagesChange: (packages: FixedEventPackageForm[]) => void;
  disabled?: boolean;
};

function activityRef(activity: EventActivityForm): string | null {
  const key = activity.clientKey?.trim() || activity.id?.trim();
  return key || null;
}

function bodyToDraft(
  body: Record<string, unknown>,
  existing: FixedEventPackageForm | null,
  displayOrder: number,
): FixedEventPackageForm {
  const activityRefs = Array.isArray(body.activityIds)
    ? (body.activityIds as unknown[]).map(String)
    : Array.isArray(body.activityRefs)
      ? (body.activityRefs as unknown[]).map(String)
      : [];
  const priceCents =
    typeof body.priceCents === "number" ? body.priceCents : Number(body.priceCents);
  const capacity =
    typeof body.capacity === "number" ? body.capacity : Number(body.capacity);
  return {
    clientKey: existing?.clientKey ?? crypto.randomUUID(),
    title: String(body.title ?? ""),
    description: typeof body.description === "string" ? body.description : "",
    badge: typeof body.badge === "string" ? body.badge : "",
    priceInput: Number.isFinite(priceCents) ? (priceCents / 100).toFixed(2) : "",
    capacityInput: Number.isFinite(capacity) ? String(capacity) : "",
    arrivalStartTime: String(body.arrivalStartTime ?? "18:00"),
    arrivalEndTime: String(body.arrivalEndTime ?? "20:00"),
    activityRefs,
    displayOrder,
    isActive: true,
  };
}

export function FixedEventPackagesDraftSection({
  activities,
  draftPackages,
  onDraftPackagesChange,
  disabled = false,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const listedActivities = activities.filter((a) => a.title.trim() && activityRef(a));
  const canAddPackage = listedActivities.length > 0 && !disabled;
  const editing = editingKey
    ? (draftPackages.find((p) => p.clientKey === editingKey) ?? null)
    : null;

  return (
    <div className="space-y-4 rounded-lg border border-gold/15 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-brand text-[10px] tracking-[0.12em] text-gold">PACKAGES</h3>
        <button
          type="button"
          disabled={!canAddPackage}
          onClick={() => {
            setEditingKey(null);
            setModalOpen(true);
          }}
          className="rounded border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add package
        </button>
      </div>

      {!canAddPackage && !disabled ? (
        <p className="text-xs text-foreground/60">
          Add at least one activity above to create packages.
        </p>
      ) : null}

      {draftPackages.length === 0 && canAddPackage ? (
        <p className="text-xs text-foreground/60">
          No packages yet. Add at least one package before creating the event.
        </p>
      ) : null}

      {draftPackages.length > 0 ? (
        <ul className="space-y-2">
          {draftPackages.map((pkg) => (
            <li
              key={pkg.clientKey}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold/10 px-3 py-2 text-sm"
            >
              <span>
                {pkg.title} — ${pkg.priceInput || "0.00"} ({pkg.capacityInput || "?"} left)
              </span>
              <TableRowActions>
                <button
                  type="button"
                  disabled={disabled}
                  className={tableIconBtnClass}
                  aria-label={`Edit ${pkg.title}`}
                  title="Edit"
                  onClick={() => {
                    setEditingKey(pkg.clientKey);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className={tableIconBtnDangerClass}
                  aria-label={`Delete ${pkg.title}`}
                  title="Delete"
                  onClick={() => {
                    onDraftPackagesChange(
                      draftPackages.filter((row) => row.clientKey !== pkg.clientKey),
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TableRowActions>
            </li>
          ))}
        </ul>
      ) : null}

      <FixedEventPackageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activities={listedActivities}
        allowDraftActivityRefs
        initial={
          editing
            ? {
                id: editing.clientKey,
                title: editing.title,
                description: editing.description || null,
                badge: editing.badge || null,
                priceCents: Math.round(
                  (Number.parseFloat(editing.priceInput) || 0) * 100,
                ),
                price: Number.parseFloat(editing.priceInput) || 0,
                capacity: Number.parseInt(editing.capacityInput, 10) || 0,
                arrivalStartTime: editing.arrivalStartTime,
                arrivalEndTime: editing.arrivalEndTime || null,
                arrivalLabel: "",
                displayOrder: editing.displayOrder,
                isActive: true,
                activityIds: editing.activityRefs,
              }
            : null
        }
        onSave={async (body) => {
          const next = bodyToDraft(
            body,
            editing,
            editing?.displayOrder ?? draftPackages.length,
          );
          if (editing) {
            onDraftPackagesChange(
              draftPackages.map((row) =>
                row.clientKey === editing.clientKey ? next : row,
              ),
            );
          } else {
            onDraftPackagesChange([...draftPackages, next]);
          }
          return { ok: true };
        }}
      />
    </div>
  );
}
