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
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="shamell-scrollbar max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-gold/20 bg-[#0c1016] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-[#0c1016] px-6 py-5">
          <h2 className="font-brand text-2xl tracking-[0.08em] text-gold">{title}</h2>
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
