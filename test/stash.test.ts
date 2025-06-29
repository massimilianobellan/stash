import { create } from "stash";
import { describe, expect, test, vi } from "vitest";

describe("stash", () => {
  const createCounterStash = (initialCount = 0, extraState = {}) =>
    create(() => ({ count: initialCount, ...extraState }));

  describe("initialization", () => {
    test("initializes state correctly", () => {
      const stashApi = createCounterStash();
      expect(stashApi.getStash()).toEqual({ count: 0 });
    });

    test("creates the API with required methods", () => {
      const stashApi = createCounterStash();
      expect(stashApi).toHaveProperty("getStash");
      expect(stashApi).toHaveProperty("setStash");
      expect(stashApi).toHaveProperty("subscribe");
    });
  });

  describe("state updates", () => {
    test("updates state with partial object", () => {
      const stashApi = createCounterStash();
      stashApi.setStash({ count: 5 });
      expect(stashApi.getStash()).toEqual({ count: 5 });
    });

    test("updates state using callback", () => {
      const stashApi = createCounterStash();
      stashApi.setStash((prevState) => ({ count: prevState.count + 1 }));
      expect(stashApi.getStash()).toEqual({ count: 1 });
    });

    test("maintains other state properties with partial updates", () => {
      const stashApi = createCounterStash(0, { name: "test" });

      stashApi.setStash({ count: 5 });
      expect(stashApi.getStash()).toEqual({ count: 5, name: "test" });

      stashApi.setStash(() => ({ count: 10 }));
      expect(stashApi.getStash()).toEqual({ count: 10, name: "test" });
    });
  });

  describe("subscriptions", () => {
    test("notifies listeners on state change", () => {
      const stashApi = createCounterStash();
      const listener = vi.fn();
      stashApi.subscribe(listener);

      stashApi.setStash({ count: 5 });
      expect(listener).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
    });

    test("stops notifying after unsubscribe", () => {
      const stashApi = createCounterStash();
      const listener = vi.fn();
      const unsubscribe = stashApi.subscribe(listener);

      unsubscribe();
      stashApi.setStash({ count: 5 });
      expect(listener).not.toHaveBeenCalled();
    });

    test("supports multiple listeners", () => {
      const stashApi = createCounterStash();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      stashApi.subscribe(listener1);
      stashApi.subscribe(listener2);

      stashApi.setStash({ count: 5 });
      expect(listener1).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
      expect(listener2).toHaveBeenCalledWith({ count: 5 }, { count: 0 });
    });

    test("doesn't notify if state doesn't change", () => {
      const stashApi = createCounterStash();
      const listener = vi.fn();
      stashApi.subscribe(listener);

      stashApi.setStash({ count: 0 });
      expect(listener).not.toHaveBeenCalled();

      stashApi.setStash(() => ({ count: 0 }));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("implementation details", () => {
    test("direct object and callback updates behave the same", () => {
      const directStash = createCounterStash(0, { name: "test" });
      directStash.setStash({ count: 5 });

      const callbackStash = createCounterStash(0, { name: "test" });
      callbackStash.setStash(() => ({ count: 5 }));

      expect(directStash.getStash()).toEqual(callbackStash.getStash());
    });

    test("shallowEqual correctly compares callback results", () => {
      const stashApi = createCounterStash();
      const listener = vi.fn();
      stashApi.subscribe(listener);

      stashApi.setStash(() => ({ count: 1 }));
      expect(listener).toHaveBeenCalledTimes(1);
      listener.mockReset();

      stashApi.setStash(() => ({ count: 1 }));
      expect(listener).not.toHaveBeenCalled();
    });

    test("callbacks receive current state", () => {
      const stashApi = createCounterStash();

      stashApi.setStash((state) => {
        expect(state).toEqual({ count: 0 });
        return { count: state.count + 1 };
      });

      stashApi.setStash((state) => {
        expect(state).toEqual({ count: 1 });
        return { count: state.count + 1 };
      });

      expect(stashApi.getStash()).toEqual({ count: 2 });
    });
  });
});
