import { useSyncExternalStore } from "react";
import { createStash, type Stash } from "stash";

export function useStash<T>(stash: Stash<T>) {
  return useSyncExternalStore(stash.subscribe, stash.getStash, stash.getStash);
}

type StateCreator<T> = (
  set: (fn: (state: T) => Partial<T>) => void,
  get: () => T
) => T;

export function create<T>(initialStash: StateCreator<T>) {
  const stash = createStash({} as T);

  const get: Parameters<StateCreator<T>>[1] = function () {
    return stash.getStash();
  };

  const set: Parameters<StateCreator<T>>[0] = function (fn) {
    const next = fn(stash.getStash());
    stash.setStash((prev) => ({ ...prev, ...next }));
  };

  const initialState = initialStash(set, get);
  stash.setStash(initialState);

  function useBoundStash() {
    return useStash(stash);
  }

  Object.assign(useBoundStash, stash);

  return useBoundStash;
}
