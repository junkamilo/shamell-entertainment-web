"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { getHeaderMediaBearerToken } from "../lib/headerMediaAuth";
import { fetchAdminHeaderPhotos } from "../services/fetchAdminHeaderPhotos";
import type { HeaderPhoto } from "../types/headerMedia.types";

export function useHeaderMediaLibrary() {
  const [photos, setPhotos] = useState<HeaderPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const paginationMeta = useMemo(() => {
    const totalItems = photos.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    return {
      page: safePage,
      perPage,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    };
  }, [page, perPage, photos.length]);

  const pagedPhotos = useMemo(() => {
    const start = (paginationMeta.page - 1) * paginationMeta.perPage;
    return photos.slice(start, start + paginationMeta.perPage);
  }, [photos, paginationMeta.page, paginationMeta.perPage]);

  const loadData = useCallback(async () => {
    const token = getHeaderMediaBearerToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const items = await fetchAdminHeaderPhotos(token);
      setPhotos(items);
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
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta.totalPages]);

  const onPerPageChange = useCallback((next: number) => {
    setPerPage(next);
    setPage(DEFAULT_PAGINATION_META.page);
  }, []);

  return {
    photos,
    setPhotos,
    isLoading,
    loadData,
    page,
    setPage,
    perPage,
    onPerPageChange,
    paginationMeta,
    pagedPhotos,
  };
}
