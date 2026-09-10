"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { getRecaptchaSiteKey } from "@/lib/recaptchaSiteKey";

type RecaptchaCheckboxProps = {
  onToken: (token: string | null) => void;
  /** When false, the checkbox is visible but cannot be solved until the form is complete. */
  enabled?: boolean;
};

type GrecaptchaApi = {
  render: (
    container: HTMLElement,
    parameters: {
      sitekey: string;
      theme: "dark" | "light";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
  ready?: (cb: () => void) => void;
};

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi;
  }
}

/** Explicit render + onload so the API is ready before `render()` (Google v2 docs). */
const RECAPTCHA_SCRIPT_SRC =
  "https://www.google.com/recaptcha/api.js?render=explicit";

const LOAD_TIMEOUT_MS = 8_000;

function googleWidgetIsMounted(el: HTMLElement | null): boolean {
  if (!el) return false;
  return Boolean(
    el.querySelector("iframe") || el.querySelector("textarea.g-recaptcha-response"),
  );
}

export default function RecaptchaCheckbox({
  onToken,
  enabled = true,
}: RecaptchaCheckboxProps) {
  const siteKey = getRecaptchaSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onTokenRef = useRef(onToken);
  const enabledRef = useRef(enabled);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const isReady = () =>
      widgetIdRef.current !== null || googleWidgetIsMounted(containerRef.current);

    const markReady = (id?: number) => {
      if (id != null) widgetIdRef.current = id;
      else if (widgetIdRef.current === null) widgetIdRef.current = -1;
      setLoadError(null);
    };

    const mount = (): boolean => {
      if (cancelled || isReady()) {
        setLoadError(null);
        return true;
      }
      const el = containerRef.current;
      const api = window.grecaptcha;
      if (!el || typeof api?.render !== "function") return false;

      try {
        const id = api.render(el, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token: string) => {
            if (!enabledRef.current) return;
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
        markReady(id);
      } catch {
        if (googleWidgetIsMounted(el)) {
          markReady();
        }
      }

      return isReady();
    };

    const containerEl = containerRef.current;
    const observer = new MutationObserver(() => {
      if (cancelled) return;
      if (googleWidgetIsMounted(containerRef.current)) {
        markReady();
        if (intervalId) clearInterval(intervalId);
      }
    });
    if (containerEl) {
      observer.observe(containerEl, { childList: true, subtree: true });
    }

    if (!mount()) {
      intervalId = setInterval(() => {
        if (mount() && intervalId) clearInterval(intervalId);
      }, 100);
      timeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
        if (cancelled || isReady()) {
          setLoadError(null);
          return;
        }
        setLoadError(
          "Verification did not load. Refresh the page, allow google.com/recaptcha, and add localhost in the reCAPTCHA admin domains.",
        );
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id != null && id >= 0) {
        window.grecaptcha?.reset(id);
      }
      if (containerEl) containerEl.innerHTML = "";
    };
  }, [siteKey]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) return;
    onTokenRef.current(null);
    const id = widgetIdRef.current;
    if (id != null && id >= 0) {
      window.grecaptcha?.reset(id);
    }
  }, [enabled]);

  if (!siteKey) {
    return (
      <p className="font-body text-sm text-red-300" role="alert">
        Human verification is not configured. Please try again later.
      </p>
    );
  }

  return (
    <div
      className="min-h-[78px]"
      aria-disabled={!enabled}
      aria-describedby={!enabled ? "recaptcha-lock-hint" : undefined}
    >
      <p className="mb-2 font-brand text-[10px] tracking-[0.14em] text-gold/80 uppercase">
        Verification
      </p>
      <Script src={RECAPTCHA_SCRIPT_SRC} strategy="afterInteractive" />
      <div className="relative inline-block min-h-[78px] min-w-[304px] max-w-full">
        <div
          ref={containerRef}
          className={cn("overflow-visible", !enabled && "opacity-40")}
          data-testid="recaptcha-checkbox"
          inert={!enabled ? true : undefined}
        />
        {!enabled ? (
          <div
            className="absolute inset-0 z-10 cursor-not-allowed rounded-sm bg-black/55"
            data-testid="recaptcha-lock"
            aria-hidden
          />
        ) : null}
      </div>
      {!enabled ? (
        <p
          id="recaptcha-lock-hint"
          className="mt-2 font-body text-xs leading-relaxed text-foreground/48"
        >
          Complete the required fields to unlock verification.
        </p>
      ) : null}
      {loadError ? (
        <p className="mt-2 font-body text-sm text-red-300" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
