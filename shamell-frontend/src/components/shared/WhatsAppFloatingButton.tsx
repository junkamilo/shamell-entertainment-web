"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FALLBACK_PHONE = "573013183474";

function normalizePhoneDigits(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? FALLBACK_PHONE;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 8 ? digits : FALLBACK_PHONE;
}

function whatsAppHref(phoneDigits: string, text: string): string {
  const base = `https://wa.me/${phoneDigits}`;
  const msg = text.trim();
  if (!msg) return base;
  const params = new URLSearchParams({ text: msg });
  return `${base}?${params.toString()}`;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

export default function WhatsAppFloatingButton() {
  const pathname = usePathname() ?? "/";
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/shamell-admin");
  const phoneDigits = normalizePhoneDigits(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
  const defaultMessage = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim() ?? "";

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  if (isAdminRoute) return null;

  const finalMessage = message.trim() || defaultMessage;
  const canSend = finalMessage.trim().length > 0;

  const onSend = () => {
    const url = whatsAppHref(phoneDigits, finalMessage);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen ? (
        <div className="mb-3 w-[min(90vw,22rem)] rounded-2xl border border-gold/30 bg-[#140a1f]/95 p-3 shadow-xl shadow-black/35 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-brand text-xs tracking-[0.15em] text-gold/90">WHATSAPP CHAT</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat"
              className="rounded-md px-2 py-1 text-xs text-foreground/70 hover:bg-gold/10 hover:text-foreground"
            >
              Close
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={defaultMessage || "Write your message..."}
            rows={4}
            className={cn(
              "w-full resize-none rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none",
              "placeholder:text-foreground/40 focus:border-gold/45 focus:ring-2 focus:ring-gold/20",
            )}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-gold/25 px-3 py-1.5 text-xs text-foreground/80 hover:bg-gold/10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={onSend}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium text-white",
                canSend ? "bg-emerald-600 hover:bg-emerald-500" : "cursor-not-allowed bg-emerald-900/40 text-emerald-100/50",
              )}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Hide WhatsApp chat" : "Open WhatsApp chat"}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          "border border-emerald-500/35 bg-emerald-600/95 text-white shadow-lg shadow-black/25",
          "ring-2 ring-emerald-400/25 transition-transform hover:scale-105 hover:bg-emerald-500",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300",
        )}
      >
        <WhatsAppGlyph className="h-7 w-7" />
      </button>
    </div>
  );
}
