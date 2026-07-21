"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BOOK_CLASS_SETUP_PATH } from "../lib/bookClassRoutes";

type Props = {
  issues: string[];
};

export function BookClassSetupNotice({ issues }: Props) {
  return (
    <div
      role="status"
      className="rounded-xl border border-gold/25 bg-gold/8 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-brand text-sm tracking-[0.06em] text-gold">
              This class event is not ready to book
            </p>
            {issues.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/70">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <Link
            href={BOOK_CLASS_SETUP_PATH}
            className="inline-flex items-center justify-center rounded-xl border border-gold/35 bg-gold/10 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:border-gold/55 hover:bg-gold/16"
          >
            Edit event in On Coming Events
          </Link>
        </div>
      </div>
    </div>
  );
}
