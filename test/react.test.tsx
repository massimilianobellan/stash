import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { create, useStash, type StashApi } from "stash";
import { expect, test } from "vitest";

test("can create a store", async () => {
  type MyStash = {
    count: number;
    incrementCount: () => void;
  };

  function Component() {
    const [stash] = useState(() =>
      create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }))
    );
    const { count, incrementCount } = useStash(stash);

    return (
      <>
        <div data-testid="count">{count}</div>
        <button onClick={incrementCount}>Click</button>
      </>
    );
  }

  render(<Component />);

  waitFor(() => expect(screen.queryByTestId("count")).toBe(0));

  await userEvent.click(screen.getByText("Click"));

  waitFor(() => expect(screen.queryByTestId("count")).toBe(1));
});

test("all components rerender", async () => {
  type MyStash = {
    count: number;
    incrementCount: () => void;
  };

  function ParentComponent() {
    const [stash] = useState(() =>
      create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }))
    );

    return (
      <>
        <Component1 stash={stash} />
        <Component2 stash={stash} />
      </>
    );
  }

  function Component1({ stash }: { stash: StashApi<MyStash> }) {
    const { count, incrementCount } = useStash(stash);

    return (
      <>
        <div>{count}</div>
        <button onClick={incrementCount}>Click</button>
      </>
    );
  }

  function Component2({ stash }: { stash: StashApi<MyStash> }) {
    const { count } = useStash(stash);

    return (
      <>
        <div>{count}</div>
      </>
    );
  }

  render(<ParentComponent />);

  expect(screen.queryAllByText("1")).toHaveLength(0);

  await userEvent.click(screen.getByText("Click"));

  expect(screen.queryAllByText("1")).toHaveLength(2);
});

test("components can be updated with atomic selectors", async () => {
  type MyStash = {
    count1: number;
    count2: number;
    incrementCount1: () => void;
    incrementCount2: () => void;
  };

  const CountContext = createContext<StashApi<MyStash> | null>(null);

  function CounterContext({ children }: { children: ReactNode }) {
    const [stash] = useState(() =>
      create<MyStash>((set) => ({
        count1: 0,
        count2: 0,
        incrementCount1: () => {
          set(({ count1 }) => ({ count1: count1 + 1 }));
        },
        incrementCount2: () => {
          set(({ count2 }) => ({ count2: count2 + 1 }));
        },
      }))
    );
    return (
      <CountContext.Provider value={stash}>{children}</CountContext.Provider>
    );
  }

  function useCount1() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context, ({ count1 }) => count1);
  }

  function useIncrementCount1() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context, ({ incrementCount1 }) => incrementCount1);
  }

  function useCount2() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context, ({ count2 }) => count2);
  }

  function useIncrementCount2() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context, ({ incrementCount1 }) => incrementCount1);
  }

  function ParentComponent() {
    return (
      <CounterContext>
        <Component1 />
        <Component2 />
      </CounterContext>
    );
  }

  function Component1() {
    const count = useCount1();
    const incrementCount = useIncrementCount1();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders1">{ref.current}</div>
        <div data-testid="count1">{count}</div>
        <button data-testid="addCount1" onClick={incrementCount}>
          Click
        </button>
      </>
    );
  }

  function Component2() {
    const count = useCount2();
    const incrementCount = useIncrementCount2();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders2">{ref.current}</div>
        <div data-testid="count2">{count}</div>
        <button data-testid="addCount2" onClick={incrementCount}>
          Click
        </button>
      </>
    );
  }

  render(<ParentComponent />);

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(1));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(0));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(0));

  await userEvent.click(screen.getByTestId("addCount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(1));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(0));

  await userEvent.click(screen.getByTestId("addCount2"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));

  await userEvent.click(screen.getByTestId("addCount1"));
  await userEvent.click(screen.getByTestId("addCount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(4));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(3));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));
});

test("can use shallow compare for partial hook", async () => {
  type MyStash = {
    count1: number;
    count2: number;
    incrementCount1: () => void;
    incrementCount2: () => void;
  };

  const CountContext = createContext<StashApi<MyStash> | null>(null);

  function CounterContext({ children }: { children: ReactNode }) {
    const [stash] = useState(() =>
      create<MyStash>((set) => ({
        count1: 0,
        count2: 0,
        incrementCount1: () => {
          set(({ count1 }) => ({ count1: count1 + 1 }));
        },
        incrementCount2: () => {
          set(({ count2 }) => ({ count2: count2 + 1 }));
        },
      }))
    );
    return (
      <CountContext.Provider value={stash}>{children}</CountContext.Provider>
    );
  }

  function useCount1() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context, ({ count1, incrementCount1 }) => ({
      count: count1,
      incrementCount: incrementCount1,
    }));
  }

  function useCount2() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context, ({ count2, incrementCount2 }) => ({
      count: count2,
      incrementCount: incrementCount2,
    }));
  }

  function ParentComponent() {
    return (
      <CounterContext>
        <Component1 />
        <Component2 />
      </CounterContext>
    );
  }

  function Component1() {
    const { count, incrementCount } = useCount1();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders1">{ref.current}</div>
        <div data-testid="count1">{count}</div>
        <button data-testid="addCount1" onClick={incrementCount}>
          Click
        </button>
      </>
    );
  }

  function Component2() {
    const { count, incrementCount } = useCount2();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders2">{ref.current}</div>
        <div data-testid="count2">{count}</div>
        <button data-testid="addCount2" onClick={incrementCount}>
          Click
        </button>
      </>
    );
  }

  render(<ParentComponent />);

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(1));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(0));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(0));

  await userEvent.click(screen.getByTestId("addCount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(1));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(0));

  await userEvent.click(screen.getByTestId("addCount2"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));

  await userEvent.click(screen.getByTestId("addCount1"));
  await userEvent.click(screen.getByTestId("addCount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(4));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(3));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));
});
