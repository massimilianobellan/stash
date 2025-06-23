import { shallowEqual } from "./shallowEqual";

type NextStashCallback<T> = (prevState: T) => Partial<T>;
type NextStash<T> = T | Partial<T> | NextStashCallback<T>;
type StashSubscriber<T> = (state: T, prevState: T) => void;

type GetStash<T> = () => T;
type SetStash<T> = (nextStash: NextStash<T>) => void;
type Subscribe<T> = (listener: StashSubscriber<T>) => () => void;

export type StashInitializer<T> = (
  set: SetStash<T>,
  get: GetStash<T>,
  stash: StashApi<T>
) => T;

export type StashApi<T> = {
  getStash: GetStash<T>;
  setStash: SetStash<T>;
  subscribe: Subscribe<T>;
};

/**
 * Creates a stash store with getter, setter, and subscriber support.
 *
 * This function initializes internal state (`stash`) using the provided `initializer`,
 * and returns an API with methods to get the current state, update it, and subscribe to changes.
 *
 * The `stash` state can be updated directly with a partial object or via a function
 * that receives the previous state and returns a partial update.
 *
 * @template T - The shape of the stash state.
 *
 * @param initializer - A function that initializes the stash state. It receives:
 *  - `set`: A function to update the stash state.
 *  - `get`: A function to retrieve the current stash state.
 *  - `stash`: The stash API itself.
 *
 * @returns An object with:
 *  - `getStash`: A function to get the current state.
 *  - `setStash`: A function to update the state.
 *  - `subscribe`: A function to listen for state changes.
 */
export function create<T>(initializer: StashInitializer<T>): StashApi<T> {
  let stash: T;
  const stashSubscribers = new Set<StashSubscriber<T>>();

  const getStash: StashApi<T>["getStash"] = function () {
    return stash;
  };

  const setStash: StashApi<T>["setStash"] = function (nextStash) {
    const prevStash = stash;
    const newStash = isNextStashCallback(nextStash)
      ? nextStash(prevStash)
      : nextStash;

    if (shallowEqual(stash, newStash)) return;

    stash = { ...prevStash, ...newStash };
    stashSubscribers.forEach((subscriber) => subscriber(stash, prevStash));
  };

  const subscribe: StashApi<T>["subscribe"] = function (listener) {
    stashSubscribers.add(listener);
    return () => stashSubscribers.delete(listener);
  };

  const stashApi: StashApi<T> = {
    getStash,
    setStash,
    subscribe,
  };

  stash = initializer(setStash, getStash, stashApi);

  return stashApi;
}

function isNextStashCallback<T>(
  nextStash: NextStash<T>
): nextStash is NextStashCallback<T> {
  return typeof nextStash === "function" && nextStash.length === 1;
}
