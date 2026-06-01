"use client";

import type { ReactNode } from "react";
import AdminModal from "@/components/admin/AdminModal";
import { truncateDeleteConfirmLabel } from "@/components/admin/adminDeleteConfirmLabel";

export type AdminDeleteConfirmModalProps = {
  title: string;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  deletingLabel?: string;
  cancelLabel?: string;
};

export type AdminDeleteConfirmMessageProps = {
  /** Short noun, e.g. "service", "service type", "event". */
  entityLabel: string;
  /** Full display name (truncated in the UI when long). */
  name: string;
  /** Optional context line above the name (e.g. service type). */
  meta?: string;
  /** One or more consequence lines below the name card. */
  consequences?: string[];
  maxNameLength?: number;
};

/**
 * Standard delete copy: intro question + name card + consequences.
 * Prefer this over inline {@link AdminDeleteConfirmHighlight} for long titles.
 */
export function AdminDeleteConfirmMessage({
  entityLabel,
  name,
  meta,
  consequences = ["This action cannot be undone."],
  maxNameLength = 72,
}: AdminDeleteConfirmMessageProps) {
  const { display, full, truncated } = truncateDeleteConfirmLabel(name, maxNameLength);

  return (
    <div className="admin-delete-confirm-message space-y-4">
      <p>
        Are you sure you want to permanently delete this {entityLabel}?
      </p>
      <div className="admin-delete-confirm-item">
        {meta ? (
          <p className="admin-delete-confirm-item-meta">{meta}</p>
        ) : null}
        <p
          className="admin-delete-confirm-item-name"
          title={truncated ? full : undefined}
        >
          {display}
        </p>
      </div>
      {consequences.map((line) => (
        <p key={line} className="admin-delete-confirm-consequence">
          {line}
        </p>
      ))}
    </div>
  );
}

/** Inline gold emphasis — best for short names (types, codes). */
export function AdminDeleteConfirmHighlight({ children }: { children: ReactNode }) {
  return (
    <span className="admin-delete-confirm-highlight font-body font-semibold text-gold normal-case">
      {children}
    </span>
  );
}

/**
 * Reusable admin delete confirmation (readable body text + Cancel / Delete actions).
 * Wrap message in {@link AdminDeleteConfirmHighlight} for the entity name when needed.
 */
export default function AdminDeleteConfirmModal({
  title,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
  children,
  confirmLabel = "Delete",
  deletingLabel = "Deleting...",
  cancelLabel = "Cancel",
}: AdminDeleteConfirmModalProps) {
  return (
    <AdminModal title={title} isOpen={isOpen} onClose={onClose} size="narrow">
      <div className="space-y-8">
        <div className="admin-delete-confirm-body space-y-4">{children}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="admin-delete-confirm-btn rounded-xl border border-gold/30 px-6 py-3.5 tracking-[0.06em] text-foreground/90 transition hover:bg-white/5 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="admin-delete-confirm-btn rounded-xl border border-red-400/45 bg-red-500/15 px-6 py-3.5 font-brand tracking-[0.08em] text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? deletingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
