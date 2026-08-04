"use client";

import { createContext, useContext, type ReactNode } from "react";

const CatalogSlideContext = createContext(false);

export function CatalogSlideProvider({
  isActive,
  children,
}: {
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <CatalogSlideContext.Provider value={isActive}>
      {children}
    </CatalogSlideContext.Provider>
  );
}

/** True when this carousel slide is the most visible (centered) item. */
export function useCatalogSlideActive(): boolean {
  return useContext(CatalogSlideContext);
}
