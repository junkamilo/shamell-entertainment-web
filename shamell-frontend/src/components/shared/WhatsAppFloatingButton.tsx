"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** E.164 digits for wa.me (US +1 239 452-1062). Override with NEXT_PUBLIC_WHATSAPP_PHONE. */
const FALLBACK_PHONE = "12394521062";
const FALLBACK_PHONE_DISPLAY = "+1 (239) 452-1062";

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

/** WhatsApp Web–style greens */
const WA_HEADER = "#128C7E";
const WA_SEND = "#25D366";
const WA_CHAT_BG = "#ECE5DD";

export default function WhatsAppFloatingButton() {
  const pathname = usePathname() ?? "/";
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/shamell-admin");
  const phoneDigits = normalizePhoneDigits(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
  const phoneDisplay =
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY?.trim() || FALLBACK_PHONE_DISPLAY;
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
    <div className="site-floating-actions fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen ? (
        <div
          className="w-[min(92vw,22rem)] overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.28)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-chat-title"
        >
          <div
            className="flex items-center justify-between gap-2 px-3 py-2.5"
            style={{ backgroundColor: WA_HEADER }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <WhatsAppGlyph className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p id="wa-chat-title" className="truncate font-sans text-[15px] font-semibold text-white">
                  WhatsApp
                </p>
                <p className="truncate font-sans text-xs font-medium text-white/95">{phoneDisplay}</p>
                <p className="truncate font-sans text-[11px] text-white/75">
                  Tap send to open WhatsApp with your message
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="shrink-0 rounded px-2 py-1 font-sans text-sm text-white/95 hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="p-3" style={{ backgroundColor: WA_CHAT_BG }}>
            <label htmlFor="wa-compose" className="sr-only">
              Your message
            </label>
            <textarea
              id="wa-compose"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={defaultMessage ? "Type or edit your message..." : "Type a message"}
              rows={4}
              className={cn(
                "w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-sans text-sm text-gray-900 outline-none",
                "placeholder:text-gray-400 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]/40",
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-[#f0f0f0] px-3 py-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded px-3 py-1.5 font-sans text-sm text-gray-700 hover:bg-gray-200/80"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={onSend}
              style={{ backgroundColor: canSend ? WA_SEND : "#9ca3af" }}
              className={cn(
                "rounded-md px-4 py-1.5 font-sans text-sm font-semibold text-white shadow-sm transition",
                canSend && "hover:brightness-110 active:brightness-95",
                !canSend && "cursor-not-allowed opacity-70",
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
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
          "bg-[#25D366] text-white shadow-lg shadow-black/30",
          "ring-2 ring-white/30 transition-transform hover:scale-105 hover:brightness-105",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        )}
      >
        <WhatsAppGlyph className="h-7 w-7" />
      </button>
    </div>
  );
}
