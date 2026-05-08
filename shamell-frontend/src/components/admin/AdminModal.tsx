"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AdminModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function AdminModal({ title, isOpen, onClose, children }: AdminModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="admin-theme fixed inset-0 z-[200] flex items-center justify-center bg-shamell-night/80 px-4 py-6 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-shamell-line-soft bg-shamell-surface-raised shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gold/15 bg-shamell-surface-deep px-6 py-5">
          <h2 id="admin-modal-title" className="admin-text-brand font-brand text-3xl tracking-[0.08em] md:text-4xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-modal-scroll min-h-0 flex-1 overflow-y-auto bg-shamell-surface-raised p-6 md:p-8 shamell-scrollbar [&_input:where([type=text],[type=email],[type=search],[type=password],[type=number],[type=tel],[type=url])]:bg-shamell-surface-deep [&_textarea]:bg-shamell-surface-deep">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
