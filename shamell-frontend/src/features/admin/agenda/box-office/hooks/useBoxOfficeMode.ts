"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AGENDA_BOX_OFFICE_PATH } from "../../lib/agendaRoutes";
import { parseBoxOfficeMode, type BoxOfficeMode } from "../lib/boxOfficeMode";

export function useBoxOfficeMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseBoxOfficeMode(searchParams.get("mode"));

  const setMode = useCallback(
    (next: BoxOfficeMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "classes") {
        params.set("mode", "classes");
      } else {
        params.delete("mode");
      }
      const qs = params.toString();
      router.replace(`${AGENDA_BOX_OFFICE_PATH}${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  return { mode, setMode };
}
