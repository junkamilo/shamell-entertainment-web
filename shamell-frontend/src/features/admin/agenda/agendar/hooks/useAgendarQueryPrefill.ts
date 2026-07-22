"use client";

import { useEffect } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { applyAgendarQueryPrefill } from "../lib/applyAgendarQueryPrefill";
import type { AgendarFormState } from "../types/agendarFormState.types";

type UseAgendarQueryPrefillOptions = {
  enabled?: boolean;
};

export function useAgendarQueryPrefill(
  searchParams: ReadonlyURLSearchParams,
  form: AgendarFormState,
  options?: UseAgendarQueryPrefillOptions,
) {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    applyAgendarQueryPrefill(searchParams, form);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill once per query change; form setters are stable
  }, [enabled, searchParams]);
}
