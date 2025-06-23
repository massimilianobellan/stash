import { create } from "stash";
import { expect, test, vi } from "vitest";

test("stashApi initializes state correctly", () => {
  const stashApi = create(() => ({ count: 0 }));

  const state = stashApi.getStash();
  expect(state).toEqual({ count: 0 });
});

test("stashApi creates the stash API correctly", () => {
  const stashApi = create(() => ({ count: 0 }));

  expect(stashApi).toHaveProperty("getStash");
  expect(stashApi).toHaveProperty("setStash");
  expect(stashApi).toHaveProperty("subscribe");
});

test("setStash updates state with partial object", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  stashApi.setStash({ count: 5 });
  const state = stashApi.getStash();
  expect(state).toEqual({ count: 5 });
});

test("setStash updates state using callback", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  stashApi.setStash((prevState) => ({ count: prevState.count + 1 }));
  const state = stashApi.getStash();
  expect(state).toEqual({ count: 1 });
});

test("subscribe notifies listeners on state change", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  const listener = vi.fn();
  stashApi.subscribe(listener);

  stashApi.setStash({ count: 5 });
  expect(listener).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
});

test("unsubscribe stops notifying listeners", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  const listener = vi.fn();
  const unsubscribe = stashApi.subscribe(listener);

  unsubscribe();
  stashApi.setStash({ count: 5 });
  expect(listener).not.toHaveBeenCalled();
});

test("setStash does not notify subscribers if state does not change", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  const listener = vi.fn();
  stashApi.subscribe(listener);

  stashApi.setStash({ count: 0 });
  expect(listener).not.toHaveBeenCalled();
});

test("subscribe allows multiple listeners", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  const listener1 = vi.fn();
  const listener2 = vi.fn();
  stashApi.subscribe(listener1);
  stashApi.subscribe(listener2);

  stashApi.setStash({ count: 5 });
  expect(listener1).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
  expect(listener2).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
});

test("unsubscribe stops notifying listeners", () => {
  const initializer = () => ({ count: 0 });
  const stashApi = create(initializer);

  const listener = vi.fn();
  const unsubscribe = stashApi.subscribe(listener);

  unsubscribe();
  stashApi.setStash({ count: 5 });
  expect(listener).not.toHaveBeenCalled();
});
