type SetStashFunction<T> = (oldStash: T) => void;
type SetStash<T> = T | SetStashFunction<T>;
type StashSubscriber = () => void;

export function createStash<T>(initialStash: T) {
  let stash = initialStash;
  const stashSubscribers = new Set<StashSubscriber>();

  function getStash() {
    return stash;
  }

  function setStash(nextStash: SetStash<T>) {
    if (typeof nextStash === "function") {
      nextStash(stash);
      return;
    }
    stash = nextStash;
    stashSubscribers.forEach((callback) => callback());
  }

  function subscribe(callback: StashSubscriber) {
    stashSubscribers.add(callback);
    return () => stashSubscribers.delete(callback);
  }

  return [getStash, setStash] as const;
}
