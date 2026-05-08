"use client";

import { useEffect, useRef } from "react";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
};

/** Loads GIS once and renders the official Google button (filled_black). */
export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(onCredential);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    handlerRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) handlerRef.current(response.credential);
        },
      });
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        width: 384,
        text: "continue_with",
        locale: "en",
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (window.google?.accounts?.id) {
      render();
      return () => {
        cancelled = true;
      };
    }

    if (existingScript) {
      existingScript.addEventListener("load", render);
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => render();
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="text-center text-xs text-foreground/50">
        Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in the frontend to enable Google sign-in.
      </p>
    );
  }

  return <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />;
}
