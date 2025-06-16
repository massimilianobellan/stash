import { useSyncExternalStore } from "react";
import { type Stash } from "stash";

export function useStash<T>(stash: Stash<T>) {
  return useSyncExternalStore(stash.subscribe, stash.getStash);
}

type CreateCallback = (set:)

export function create<T>() {

}