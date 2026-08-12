"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClassCartItem, ClassSessionCart } from "../types/classSessionCart.types";

const STORAGE_PREFIX = "shamell:class-cart:";

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function readStoredCart(slug: string): ClassSessionCart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (!raw) return { items: [] };
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return { items: [] };
    }
    const items = (parsed as { items: unknown[] }).items.filter(
      (row): row is ClassCartItem =>
        !!row &&
        typeof row === "object" &&
        typeof (row as ClassCartItem).sessionId === "string" &&
        typeof (row as ClassCartItem).dateIso === "string" &&
        typeof (row as ClassCartItem).price === "number",
    );
    return { items };
  } catch {
    return { items: [] };
  }
}

function writeStoredCart(slug: string, cart: ClassSessionCart) {
  if (typeof window === "undefined") return;
  try {
    if (cart.items.length === 0) {
      sessionStorage.removeItem(storageKey(slug));
      return;
    }
    sessionStorage.setItem(storageKey(slug), JSON.stringify(cart));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function useClassSessionCart(slug: string) {
  const [items, setItems] = useState<ClassCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart(slug).items);
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredCart(slug, { items });
  }, [slug, items, hydrated]);

  const replaceDay = useCallback((dateIso: string, dayItems: ClassCartItem[]) => {
    setItems((prev) => {
      const kept = prev.filter((item) => item.dateIso !== dateIso);
      const byId = new Map<string, ClassCartItem>();
      for (const item of kept) byId.set(item.sessionId, item);
      for (const item of dayItems) byId.set(item.sessionId, item);
      return [...byId.values()].sort((a, b) =>
        a.dateIso === b.dateIso
          ? a.startTime.localeCompare(b.startTime)
          : a.dateIso.localeCompare(b.dateIso),
      );
    });
  }, []);

  const removeItem = useCallback((sessionId: string) => {
    setItems((prev) => prev.filter((item) => item.sessionId !== sessionId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemsForDate = useCallback(
    (dateIso: string) => items.filter((item) => item.dateIso === dateIso),
    [items],
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const count = items.length;

  return {
    items,
    count,
    total,
    hydrated,
    replaceDay,
    removeItem,
    clear,
    itemsForDate,
  };
}
