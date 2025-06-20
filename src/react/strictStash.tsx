import { createContext, useContext, useState, type ReactNode } from "react";
import {
  create,
  useStash,
  type Selector,
  type StashApi,
  type StashInitializer,
} from "stash";

type StrictStashReturn<T> = [
  <S = T>(selector?: Selector<T, S>) => S,
  ({ children }: { children: ReactNode }) => ReactNode,
];

/**
 * Creates a typed stash hook and provider with context safety.
 *
 * @template T - Type of the stash state.
 * @param {StashInitializer<T>} initialStash - Function to initialize stash state.
 * @param {string} [stashName] - Optional name for error messages.
 * @returns {[useStash: function, StashProvider: React.FC]} Hook and provider pair.
 *
 * @example
 * const [useCounter, CounterProvider] = createStrictStash(() => ({ count: 0 }));
 *
 * function Parent() {
 *   return
 * }
 *
 * function Counter() {
 *   const { count } = useCounter((s) => ({ count: s.count }));
 *   return <span>{count}</span>;
 * }
 */

export function createStrictStash<T>(
  initialStash: StashInitializer<T>,
  stashName?: string
): StrictStashReturn<T> {
  const StashContext = createContext<StashApi<T> | null>(null);

  const StashProvider: StrictStashReturn<T>[1] = function ({
    children,
  }: {
    children: ReactNode;
  }) {
    const [stash] = useState(create(initialStash));

    return (
      <StashContext.Provider value={stash}>{children}</StashContext.Provider>
    );
  };

  function useStrictStash(): T;
  function useStrictStash<S>(selector: Selector<T, S>): S;
  function useStrictStash<S extends T = T>(selector?: Selector<T, S>) {
    const context = useContext(StashContext);

    if (context === null) {
      throw new Error(`${stashName} Context Provider is missing in the tree`);
    }

    const stashSelector = selector ?? ((context) => context);

    return useStash(context, stashSelector);
  }

  return [useStrictStash, StashProvider];
}
