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
import { create, useStash } from "stash";
import { expect, test } from "vitest";

test("can create a store", async () => {
  type MyStash = {
    count: number;
    incrementCount: () => void;
  };

  function Component() {
    const [useStash] = useState(() =>
      create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }))
    );
    const { count, incrementCount } = useStash();

    return (
      <>
        <div>{count}</div>
        <button onClick={incrementCount}>Click</button>
      </>
    );
  }

  render(<Component />);

  await userEvent.click(screen.getByText("Click"));

  expect(screen.getByText("1")).toBeInTheDocument();
});

test("all components rerender", async () => {
  type MyStash = {
    count: number;
    incrementCount: () => void;
  };

  function ParentComponent() {
    const [useStash] = useState(() =>
      create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }))
    );

    return (
      <>
        <Component1 useStash={useStash} />
        <Component2 useStash={useStash} />
      </>
    );
  }

  function Component1({ useStash }: { useStash: () => MyStash }) {
    const { count, incrementCount } = useStash();

    return (
      <>
        <div>{count}</div>
        <button onClick={incrementCount}>Click</button>
      </>
    );
  }

  function Component2({ useStash }: { useStash: () => MyStash }) {
    const { count } = useStash();

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

test("components can be updated with selectors", async () => {
  type MyStash = {
    count1: number;
    count2: number;
    incrementCount1: () => void;
    incrementCount2: () => void;
  };

  function ParentComponent() {
    const [useStash] = useState(() =>
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
      <>
        <Component1 useStash={useStash} />
        <Component2 useStash={useStash} />
      </>
    );
  }

  function Component1({ useStash }: { useStash: () => MyStash }) {
    const { count1, incrementCount1 } = useStash();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders1">{ref.current}</div>
        <div data-testid="count1">{count1}</div>
        <button data-testid="addcount1" onClick={incrementCount1}>
          Click
        </button>
      </>
    );
  }

  function Component2({ useStash }: { useStash: () => MyStash }) {
    const { count2, incrementCount2 } = useStash();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders2">{ref.current}</div>
        <div data-testid="count2">{count2}</div>
        <button data-testid="addcount2" onClick={incrementCount2}>
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

  await userEvent.click(screen.getByTestId("addcount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(1));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(0));

  await userEvent.click(screen.getByTestId("addcount2"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));

  await userEvent.click(screen.getByTestId("addcount1"));
  await userEvent.click(screen.getByTestId("addcount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(4));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(3));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));
});

test.skip("hook can be used from components in a context", async () => {
  type MyStash = {
    count1: number;
    count2: number;
    incrementCount1: () => void;
    incrementCount2: () => void;
  };

  const CountContext = createContext<MyStash | null>(null);

  function CounterContext({ children }: { children: ReactNode }) {
    const [useStash] = useState(() =>
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
      <CountContext.Provider value={useStash}>{children}</CountContext.Provider>
    );
  }

  function useCounter1() {
    const context = useContext(CountContext);
    if (!context) throw new Error("Did not use useCounter1 in Context");
    return useStash(context);
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
    const { count1, incrementCount1 } = useStash();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders1">{ref.current}</div>
        <div data-testid="count1">{count1}</div>
        <button data-testid="addcount1" onClick={incrementCount1}>
          Click
        </button>
      </>
    );
  }

  function Component2() {
    const { count2, incrementCount2 } = useStash();
    const ref = useRef(0);

    useEffect(() => {
      ref.current = ref.current + 1;
    });

    return (
      <>
        <div data-testid="rerenders2">{ref.current}</div>
        <div data-testid="count2">{count2}</div>
        <button data-testid="addcount2" onClick={incrementCount2}>
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

  await userEvent.click(screen.getByTestId("addcount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(1));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(0));

  await userEvent.click(screen.getByTestId("addcount2"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(2));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(1));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));

  await userEvent.click(screen.getByTestId("addcount1"));
  await userEvent.click(screen.getByTestId("addcount1"));

  waitFor(() => expect(screen.queryByTestId("rerenders1")).toBe(4));
  waitFor(() => expect(screen.queryByTestId("rerenders2")).toBe(2));

  waitFor(() => expect(screen.queryByTestId("count1")).toBe(3));
  waitFor(() => expect(screen.queryByTestId("count2")).toBe(1));
});
