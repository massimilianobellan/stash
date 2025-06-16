type NextStashCallback<T> = (prevStash: T) => T;
type NextStash<T> = T | NextStashCallback<T>;
type SetStash<T> = (nextStash: NextStash<T>) => void;
type StashSubscriber<T> = (state: T, prevState: T) => void;

export type Stash<T> = {
  getStash: () => T;
  setStash: SetStash<T>;
  subscribe: (listener: StashSubscriber<T>) => () => void;
};

export function createStash<T>(initialStash: T): Stash<T> {
  let stash = initialStash;
  const stashSubscribers = new Set<StashSubscriber<T>>();

  const getStash: Stash<T>["getStash"] = function () {
    return stash;
  };

  const setStash: Stash<T>["setStash"] = function (nextStash) {
    const prevStash = stash;
    if (isNextStashCallback(nextStash)) {
      stash = nextStash(stash);
    } else {
      stash = nextStash;
    }
    stashSubscribers.forEach((subscriber) => subscriber(stash, prevStash));
  };

  const subscribe: Stash<T>["subscribe"] = function (listener) {
    stashSubscribers.add(listener);
    return () => stashSubscribers.delete(listener);
  };

  return { setStash, getStash, subscribe };
}

function isNextStashCallback<T>(
  nextStash: NextStash<T>
): nextStash is NextStashCallback<T> {
  return typeof nextStash === "function" && nextStash.length === 1;
}
