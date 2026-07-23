"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AGENDAR_PATH } from "../../lib/agendaRoutes";
import { parseBookClassKind, type BookClassKind } from "../lib/bookClassKind";

export function useBookClassKind() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classKind = parseBookClassKind(searchParams.get("classKind"));

  const setClassKind = useCallback(
    (kind: BookClassKind) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", "class");
      if (kind === "group") {
        params.set("classKind", "group");
      } else {
        params.delete("classKind");
      }
      const qs = params.toString();
      router.replace(`${AGENDAR_PATH}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return { classKind, setClassKind };
}
