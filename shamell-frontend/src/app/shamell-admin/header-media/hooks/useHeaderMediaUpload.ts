"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fileKey, formatFileSize } from "../lib/headerMediaUtils";

export function useHeaderMediaUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);

  const pendingTotalBytes = useMemo(
    () => pendingFiles.reduce((acc, f) => acc + f.size, 0),
    [pendingFiles],
  );

  const mergeFiles = useCallback((incoming: File[]) => {
    const mediaFiles = incoming.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    setPendingFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of mediaFiles) {
        const k = fileKey(f);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(f);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const keys = new Set(pendingFiles.map(fileKey));
    setPendingPreviews((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!keys.has(k)) {
          URL.revokeObjectURL(next[k]!);
          delete next[k];
        }
      }
      for (const f of pendingFiles) {
        const k = fileKey(f);
        if (!next[k]) next[k] = URL.createObjectURL(f);
      }
      return next;
    });
  }, [pendingFiles]);

  const clearPending = useCallback(() => {
    setPendingPreviews((prev) => {
      for (const u of Object.values(prev)) URL.revokeObjectURL(u);
      return {};
    });
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePendingOne = useCallback((key: string) => {
    setPendingFiles((prev) => prev.filter((f) => fileKey(f) !== key));
  }, []);

  const onPickFiles = useCallback(() => fileInputRef.current?.click(), []);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(event.target.files ?? []);
      if (list.length) mergeFiles(list);
      event.target.value = "";
    },
    [mergeFiles],
  );

  const onDropzoneDragOver = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDropzoneDragLeave = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const onDropzoneDrop = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const list = Array.from(e.dataTransfer.files ?? []);
      if (list.length) mergeFiles(list);
    },
    [mergeFiles],
  );

  return {
    fileInputRef,
    pendingFiles,
    pendingPreviews,
    pendingTotalBytes,
    formatFileSize,
    dragOver,
    mergeFiles,
    clearPending,
    removePendingOne,
    onPickFiles,
    onInputChange,
    onDropzoneDragOver,
    onDropzoneDragLeave,
    onDropzoneDrop,
  };
}
