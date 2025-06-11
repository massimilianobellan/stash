type NextStashCallback<T> = (prevStash: T) => T;
type NextStash<T> = T | NextStashCallback<T>;
type SetStash<T> = (nextStash: NextStash<T>) => void;
type StashSubscriber = () => void;

export type Stash<T> = {
  getStash: () => T;
  setStash: SetStash<T>;
  subscribe: (cb: StashSubscriber) => StashSubscriber;
};

export function createStash<T>(initialStash: T): Stash<T> {
  let stash = initialStash;
  const stashSubscribers = new Set<StashSubscriber>();

  const getStash: Stash<T>["getStash"] = function () {
    return stash;
  };

  const setStash: Stash<T>["setStash"] = function (nextStash) {
    if (isNextStashCallback(nextStash)) {
      stash = nextStash(stash);
    } else {
      stash = nextStash;
    }
  };

  const subscribe: Stash<T>["subscribe"] = function (callback) {
    stashSubscribers.add(callback);
    return () => stashSubscribers.delete(callback);
  };

  return { setStash, getStash, subscribe };
}

function isNextStashCallback<T>(
  nextStash: NextStash<T>
): nextStash is NextStashCallback<T> {
  return typeof nextStash === "function" && nextStash.length === 1;
}
