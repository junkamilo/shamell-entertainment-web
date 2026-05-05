"use client";

import { X } from "lucide-react";

type AdminModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function AdminModal({ title, isOpen, onClose, children }: AdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="admin-overlay fixed inset-0 z-90 flex items-center justify-center px-4 py-6">
      <div className="admin-panel shamell-scrollbar max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-(--background-elevated) px-6 py-5">
          <h2 className="admin-text-brand font-brand text-2xl tracking-[0.08em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
