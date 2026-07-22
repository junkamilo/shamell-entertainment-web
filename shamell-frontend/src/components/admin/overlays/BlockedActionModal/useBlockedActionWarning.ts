"use client";

import { useCallback, useState } from "react";

export type BlockedActionWarningContent = {
  title: string;
  description: string;
};

export function useBlockedActionWarning() {
  const [content, setContent] = useState<BlockedActionWarningContent | null>(null);

  const openWarning = useCallback((next: BlockedActionWarningContent) => {
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
