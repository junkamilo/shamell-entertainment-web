"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, PowerOff, Trash2 } from "lucide-react";
import {
  TableRowActions,
  tableIconBtnClass,
  tableIconBtnDangerClass,
} from "@/components/admin/data-display";
import {
  createFixedEventPackage,
  deleteFixedEventPackage,
  fetchFixedEventPackages,
  updateFixedEventPackage,
} from "@/features/admin/on-coming-events/fixed-packages/services/fixedEventPackagesApi";
import { persistEventActivities } from "@/features/admin/on-coming-events/fixed-packages/services/persistEventActivities";
import type {
  AdminFixedEventPackage,
  EventActivityForm,
} from "@/features/admin/on-coming-events/fixed-packages/types/fixedEventPackage.types";
import { FixedEventPackageModal } from "./FixedEventPackageModal";

type Props = {
  eventId: string;
  token: string;
  activities: EventActivityForm[];
  onActivitiesChange?: (activities: EventActivityForm[]) => void;
  onPackagesUpdated?: (packages: AdminFixedEventPackage[]) => void;
};

export function FixedEventPackagesSection({
  eventId,
  token,
  activities,
  onActivitiesChange,
  onPackagesUpdated,
}: Props) {
  const [packages, setPackages] = useState<AdminFixedEventPackage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFixedEventPackage | null>(null);
  const [openingPackage, setOpeningPackage] = useState(false);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const listedActivities = activities.filter((a) => a.title.trim());
  const canAddPackage = listedActivities.length > 0;

  const reload = useCallback(async () => {
    const result = await fetchFixedEventPackages(token, eventId);
    if (result.ok) {
      setPackages(result.packages);
      onPackagesUpdated?.(result.packages);
    }
  }, [eventId, onPackagesUpdated, token]);

  const activityIdsKey = activities
    .map((a) => a.id)
    .filter(Boolean)
    .sort()
    .join(",");

  useEffect(() => {
    void reload();
  }, [reload, activityIdsKey]);

  const ensureActivitiesSaved = async (): Promise<EventActivityForm[] | null> => {
    if (listedActivities.every((a) => a.id) && listedActivities.every((a) => !a.pendingMediaFile)) {
      return listedActivities;
    }
    const result = await persistEventActivities(token, eventId, listedActivities);
    if (!result.ok) {
      window.alert(result.message ?? "Could not save activities before creating a package.");
      return null;
    }
    onActivitiesChange?.(result.activities);
    return result.activities;
  };

  return (
    <div className="space-y-4 rounded-lg border border-gold/15 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-brand text-[10px] tracking-[0.12em] text-gold">PACKAGES</h3>
        <button
          type="button"
          disabled={!canAddPackage || openingPackage}
          onClick={() => {
            void (async () => {
              setOpeningPackage(true);
              const synced = await ensureActivitiesSaved();
              setOpeningPackage(false);
              if (!synced) return;
              setEditing(null);
              setModalOpen(true);
            })();
          }}
          className="rounded border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {openingPackage ? "Preparing..." : "Add package"}
        </button>
      </div>

      {!canAddPackage ? (
        <p className="text-xs text-foreground/60">
          Add at least one activity above to create packages.
        </p>
      ) : null}

      {packages.length === 0 && canAddPackage ? (
        <p className="text-xs text-foreground/60">No packages yet. Add at least one active package.</p>
      ) : null}
      {packages.length > 0 ? (
        <ul className="space-y-2">
          {packages.map((pkg) => {
            const isBusy = busyPackageId === pkg.id;
            return (
              <li
                key={pkg.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold/10 px-3 py-2 text-sm"
              >
                <span className={pkg.isActive === false ? "text-foreground/45" : undefined}>
                  {pkg.title} — ${(pkg.priceCents / 100).toFixed(2)} ({pkg.remaining ?? "?"} left)
                  {pkg.isActive === false ? " · inactive" : ""}
                </span>
                <TableRowActions>
                  <button
                    type="button"
                    disabled={isBusy}
                    className={tableIconBtnClass}
                    aria-label={`Edit ${pkg.title}`}
                    title="Edit"
                    onClick={() => {
                      setEditing(pkg);
                      setModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  {pkg.isActive !== false ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      className={tableIconBtnClass}
                      aria-label={`Deactivate ${pkg.title}`}
                      title="Deactivate"
                      onClick={() => {
                        void (async () => {
                          setBusyPackageId(pkg.id);
                          await updateFixedEventPackage(token, eventId, pkg.id, {
                            isActive: false,
                          });
                          await reload();
                          setBusyPackageId(null);
                        })();
                      }}
                    >
                      <PowerOff className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={isBusy}
                    className={tableIconBtnDangerClass}
                    aria-label={`Delete ${pkg.title}`}
                    title="Delete"
                    onClick={() => {
                      void (async () => {
                        setBusyPackageId(pkg.id);
                        const result = await deleteFixedEventPackage(token, eventId, pkg.id);
                        if (result.ok) await reload();
                        else if (result.message) window.alert(result.message);
                        setBusyPackageId(null);
                      })();
                    }}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </TableRowActions>
              </li>
            );
          })}
        </ul>
      ) : null}

      <FixedEventPackageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activities={listedActivities}
        initial={editing}
        onSave={async (body) => {
          const result = editing
            ? await updateFixedEventPackage(token, eventId, editing.id, body)
            : await createFixedEventPackage(token, eventId, body);
          if (result.ok) await reload();
          return { ok: result.ok, message: result.message };
        }}
      />
    </div>
  );
}
