import { useSyncExternalStore } from "react";
import { createStash, type Stash } from "stash";

type Selector<T> = (state: T) => T;

export function useStash<T>(stash: Stash<T>): T;
export function useStash<T, Slice = T>(
  stash: Stash<T>,
  selector?: Selector<Slice>
): T;
export function useStash<T>(
  stash: Stash<T>,
  selector: Selector<T> = (state) => state
) {
  const slice = useSyncExternalStore(
    stash.subscribe,
    () => selector(stash.getStash()),
    () => selector(stash.getStash())
  );
  return slice;
}

type StateCreator<T> = (
  set: (fn: (state: T) => Partial<T>) => void,
  get: () => T
) => T;

export type StashApi<T> = (selector?: Selector<T>) => T;

export function create<T>(initialStash: StateCreator<T>): StashApi<T> {
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

  function useBoundStash(selector?: Selector<T>) {
    return useStash(stash, selector);
  }

  Object.assign(useBoundStash, stash);

  return useBoundStash;
}
