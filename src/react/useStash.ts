import { useEffect, useState } from "react";
import type { Stash } from "stash";

export function useStash<T>(stash: Stash<T>) {
  const [state, setState] = useState(stash.getStash());

  useEffect(() => {
    const unsubscribe = stash.subscribe(() => {
      setState(stash.getStash());
    });
    return unsubscribe;
  }, [stash]);

  return [state, stash.setStash] as const;
}
