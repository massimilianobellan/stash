import { useRef, useSyncExternalStore } from "react";
import { shallowEqual } from "../shallowEqual";
import { type StashApi } from "../stash";

export type Selector<T, S = T> = (state: T) => S;

/**
 * React hook to subscribe to a `StashApi` store and select part or all of its state.
 *
 * This hook uses React's `useSyncExternalStore` under the hood to subscribe to the
 * provided stash and update the component when the stash state changes.
 *
 * @template T - The full state type of the stash.
 * @template S - The selected subset of the state to return (defaults to `T`).
 *
 * @param stash - The `StashApi` instance to subscribe to.
 * @param selector - Optional selector function to pick a part of the state.
 *                   If omitted, the entire state is returned.
 *
 * @returns The selected state slice, or the entire stash state if no selector is provided.
 *
 * @example
 * ```tsx
 * type CounterState = { count: number };
 * const counterStash: StashApi<CounterState>;
 * const count = useStash(counterStash, state => state.count);
 * ```
 */
export function useStash<T>(stash: StashApi<T>): T;
export function useStash<T, S>(stash: StashApi<T>, selector: Selector<T, S>): S;
export function useStash<T, S = T>(
  stash: StashApi<T>,
  selector?: Selector<T, S>
) {
  const lastSelectionRef = useRef<T | S>(stash.getStash());

  const getSnapshot: () => T | S = function () {
    const state = stash.getStash();
    const selected = selector ? selector(state) : state;
    const prev = lastSelectionRef.current;

    if (prev === undefined || !shallowEqual(prev, selected)) {
      lastSelectionRef.current = selected;
    }

    return lastSelectionRef.current;
  };

  return useSyncExternalStore(stash.subscribe, getSnapshot, getSnapshot);
}
