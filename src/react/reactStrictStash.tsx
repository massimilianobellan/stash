import { createContext, useContext, useState, type ReactNode } from "react";
import {
  create,
  useStash,
  type Selector,
  type StashApi,
  type StashInitializer,
} from "stash";

type StrictStashReturn<T> = [
  (selector: Selector<T>) => T,
  ({ children }: { children: ReactNode }) => ReactNode,
];

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

  const useStrictStash: StrictStashReturn<T>[0] = function (
    selector?: Selector<T>
  ) {
    const context = useContext(StashContext);

    if (context === null) {
      throw new Error(`${stashName} Context Provider is missing in the tree`);
    }

    const stashSelector = selector ?? ((context) => context);

    return useStash(context, stashSelector);
  };

  return [useStrictStash, StashProvider];
}
