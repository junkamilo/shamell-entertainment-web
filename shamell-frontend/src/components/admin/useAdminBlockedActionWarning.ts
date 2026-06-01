"use client";

import { useCallback, useState } from "react";

export type AdminBlockedActionWarningContent = {
  title: string;
  description: string;
};

export function useAdminBlockedActionWarning() {
  const [content, setContent] = useState<AdminBlockedActionWarningContent | null>(null);

  const openWarning = useCallback((next: AdminBlockedActionWarningContent) => {
    setContent(next);
  }, []);

  const closeWarning = useCallback(() => {
    setContent(null);
  }, []);

  return {
    isOpen: content != null,
    title: content?.title ?? "",
    description: content?.description ?? "",
    openWarning,
    closeWarning,
  };
}
