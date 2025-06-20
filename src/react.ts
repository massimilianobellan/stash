import { useSyncExternalStore } from "react";
import type { StashApi } from "./stash";

type Selector<T, S> = (state: T) => S;

export function useStash<T>(stash: StashApi<T>): T;
export function useStash<T, S>(stash: StashApi<T>, selector: Selector<T, S>): S;
export function useStash<T, S = T>(
  stash: StashApi<T>,
  selector: Selector<T, S> = (state) => state
) {
  return useSyncExternalStore(
    stash.subscribe,
    () => selector(stash.getStash()),
    () => selector(stash.getStash())
  );
}
