type NextStashCallback<T> = (prevState: T) => Partial<T>;
type NextStash<T> = T | Partial<T> | NextStashCallback<T>;
type StashSubscriber<T> = (state: T, prevState: T) => void;

type GetStash<T> = () => T;
type SetStash<T> = (nextStash: NextStash<T>) => void;
type Subscribe<T> = (listener: StashSubscriber<T>) => () => void;

type StashInitializer<T> = (
  set: SetStash<T>,
  get: GetStash<T>,
  stash: StashApi<T>
) => T;

export type StashApi<T> = {
  getStash: GetStash<T>;
  setStash: SetStash<T>;
  subscribe: Subscribe<T>;
};

export function create<T>(initializer: StashInitializer<T>): StashApi<T> {
  let stash: T;
  const stashSubscribers = new Set<StashSubscriber<T>>();

  const getStash: StashApi<T>["getStash"] = function () {
    return stash;
  };

  const setStash: StashApi<T>["setStash"] = function (nextStash) {
    const prevStash = stash;
    if (isNextStashCallback(nextStash)) {
      stash = { ...prevStash, ...nextStash(prevStash) };
    } else {
      stash = { ...prevStash, ...nextStash };
    }
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
