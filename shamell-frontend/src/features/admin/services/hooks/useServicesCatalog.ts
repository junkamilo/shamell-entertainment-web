"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminServiceTypes } from "@/features/admin/service-types/services/fetchAdminServiceTypes";
import type { ServiceTypeItem } from "@/features/admin/service-types/types/serviceTypes.types";
import { toast } from "@/hooks/use-toast";
import { getServicesBearerToken } from "../lib/servicesAuth";
import { fetchAdminServicesShared } from "./useServicesQuery";
import type { AdminService } from "../types/services.types";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

export function useServicesCatalog(onSeedServiceTypes: (types: ServiceTypeItem[]) => void) {
  const [services, setServices] = useState<AdminService[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    const token = getServicesBearerToken();
    if (!token) {
      setServices([]);
      setServiceTypes([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [types, items] = await Promise.all([
        fetchAdminServiceTypes(token),
        fetchAdminServicesShared(token),
      ]);
      setServiceTypes(types);
      if (types.length > 0) onSeedServiceTypes(types);
      setServices(items);
    } catch (err) {
      const offline = isOfflineError(err);
      toast({
        variant: "destructive",
        title: offline ? "Offline" : "Error",
        description: offline
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : "Could not load services.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSeedServiceTypes]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  return { services, serviceTypes, isLoading, loadAllData };
}
