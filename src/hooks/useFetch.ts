'use client';

import { useState, useEffect } from "react";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string, options?: RequestInit): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null });

    fetch(url, options)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: null, isLoading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
