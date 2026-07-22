"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "../lib/aboutAdminAuth";
import { buildAboutStats } from "../lib/aboutAdminUtils";
import { parseAboutAdminError } from "../lib/parseAboutAdminError";
import { fetchAdminAbout } from "../services/fetchAdminAbout";
import type { AdminAboutRow } from "../types/aboutAdmin.types";

export function useAdminAboutRecord() {
  const [record, setRecord] = useState<AdminAboutRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const result = await fetchAdminAbout(token);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseAboutAdminError(result.data, "Could not load About Shamell."),
        });
        return;
      }
      setRecord(result.record);
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => buildAboutStats(record), [record]);
  const coreValuesList = record?.coreValues ?? [];

  return { record, isLoading, reload, stats, coreValuesList };
}
