import { useEffect, useState } from "react";

/** True after the component has mounted on the client (avoids SSR/client HTML mismatches). */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
