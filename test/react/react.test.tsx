import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { create, type StashApi } from "stash";
import { createStrictStash, useStash } from "stash/react";
import { describe, expect, test } from "vitest";

describe("useStash hook", () => {
  test("can create and use a store", async () => {
    type CounterStash = {
      count: number;
      incrementCount: () => void;
    };

    function Counter() {
      const [stash] = useState(() =>
        create<CounterStash>((set) => ({
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

    render(<Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await userEvent.click(screen.getByText("Click"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  test("all components rerender when using shared stash", async () => {
    type CounterStash = {
      count: number;
      incrementCount: () => void;
    };

    const createCounterStash = () =>
      create<CounterStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }));

    function App() {
      const [stash] = useState(createCounterStash);
      return (
        <>
          <Counter stash={stash} />
          <Display stash={stash} />
        </>
      );
    }

    function Counter({ stash }: { stash: StashApi<CounterStash> }) {
      const { count, incrementCount } = useStash(stash);
      return (
        <>
          <div data-testid="counter">{count}</div>
          <button data-testid="increment" onClick={incrementCount}>
            Click
          </button>
        </>
      );
    }

    function Display({ stash }: { stash: StashApi<CounterStash> }) {
      const { count } = useStash(stash);
      return <div data-testid="display">{count}</div>;
    }

    render(<App />);
    expect(screen.getByTestId("counter")).toHaveTextContent("0");
    expect(screen.getByTestId("display")).toHaveTextContent("0");

    await userEvent.click(screen.getByTestId("increment"));
    expect(screen.getByTestId("counter")).toHaveTextContent("1");
    expect(screen.getByTestId("display")).toHaveTextContent("1");
  });

  test("works with global state without context", async () => {
    type CounterStash = {
      count: number;
      incrementCount: () => void;
    };

    const globalStash = create<CounterStash>((set) => ({
      count: 0,
      incrementCount: () => {
        set(({ count }) => ({ count: count + 1 }));
      },
    }));

    function Counter() {
      const { count, incrementCount } = useStash(globalStash);
      return (
        <>
          <div data-testid="count">{count}</div>
          <button data-testid="increment" onClick={incrementCount}>
            Click
          </button>
        </>
      );
    }

    function Display() {
      const { count } = useStash(globalStash);
      return <div data-testid="display">{count}</div>;
    }

    render(
      <>
        <Counter />
        <Display />
      </>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("display")).toHaveTextContent("0");

    await userEvent.click(screen.getByTestId("increment"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("display")).toHaveTextContent("1");
  });

  test("components only rerender when their selected state changes", async () => {
    type CounterStash = {
      count1: number;
      count2: number;
      incrementCount1: () => void;
      incrementCount2: () => void;
    };

    const CountContext = createContext<StashApi<CounterStash> | null>(null);

    function CountProvider({ children }: { children: ReactNode }) {
      const [stash] = useState(() =>
        create<CounterStash>((set) => ({
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

    function Counter1() {
      const context = useContext(CountContext);
      if (!context) throw new Error("Missing context");

      const count = useStash(context, ({ count1 }) => count1);
      const incrementCount = useStash(
        context,
        ({ incrementCount1 }) => incrementCount1
      );
      const renders = useRef(0);

      useEffect(() => {
        renders.current++;
      });

      return (
        <>
          <div data-testid="renders1">{renders.current}</div>
          <div data-testid="count1">{count}</div>
          <button data-testid="increment1" onClick={incrementCount}>
            Click
          </button>
        </>
      );
    }

    function Counter2() {
      const context = useContext(CountContext);
      if (!context) throw new Error("Missing context");

      const count = useStash(context, ({ count2 }) => count2);
      const incrementCount = useStash(
        context,
        ({ incrementCount1 }) => incrementCount1
      );
      const renders = useRef(0);

      useEffect(() => {
        renders.current++;
      });

      return (
        <>
          <div data-testid="renders2">{renders.current}</div>
          <div data-testid="count2">{count}</div>
          <button data-testid="increment2" onClick={incrementCount}>
            Click
          </button>
        </>
      );
    }

    render(
      <CountProvider>
        <Counter1 />
        <Counter2 />
      </CountProvider>
    );

    expect(screen.getByTestId("count1")).toHaveTextContent("0");
    expect(screen.getByTestId("count2")).toHaveTextContent("0");

    expect(screen.getByTestId("renders1")).toHaveTextContent("0");
    expect(screen.getByTestId("renders2")).toHaveTextContent("0");

    await userEvent.click(screen.getByTestId("increment1"));
    expect(screen.getByTestId("count1")).toHaveTextContent("1");
    expect(screen.getByTestId("count2")).toHaveTextContent("0");
    expect(screen.getByTestId("renders1")).toHaveTextContent("1");
    expect(screen.getByTestId("renders2")).toHaveTextContent("0");

    await userEvent.click(screen.getByTestId("increment1"));
    expect(screen.getByTestId("count1")).toHaveTextContent("2");
    expect(screen.getByTestId("renders1")).toHaveTextContent("2");
    expect(screen.getByTestId("renders2")).toHaveTextContent("0");
  });
});

describe("createStrictStash", () => {
  test("shallow comparison prevents unnecessary rerenders", async () => {
    type DualCounterStash = {
      count1: number;
      count2: number;
      incrementCount1: () => void;
      incrementCount2: () => void;
    };

    const [useStash, StashProvider] = createStrictStash<DualCounterStash>(
      (set) => ({
        count1: 0,
        count2: 0,
        incrementCount1: () => {
          set(({ count1 }) => ({ count1: count1 + 1 }));
        },
        incrementCount2: () => {
          set(({ count2 }) => ({ count2: count2 + 1 }));
        },
      })
    );

    function Counter1() {
      const { count, incrementCount } = useStash(
        ({ count1, incrementCount1 }) => ({
          count: count1,
          incrementCount: incrementCount1,
        })
      );
      const renders = useRef(0);

      useEffect(() => {
        renders.current++;
      });

      return (
        <>
          <div data-testid="renders1">{renders.current}</div>
          <div data-testid="count1">{count}</div>
          <button data-testid="increment1" onClick={incrementCount}>
            Click
          </button>
        </>
      );
    }

    function Counter2() {
      const { count, incrementCount } = useStash(
        ({ count2, incrementCount2 }) => ({
          count: count2,
          incrementCount: incrementCount2,
        })
      );
      const renders = useRef(0);

      useEffect(() => {
        renders.current++;
      });

      return (
        <>
          <div data-testid="renders2">{renders.current}</div>
          <div data-testid="count2">{count}</div>
          <button data-testid="increment2" onClick={incrementCount}>
            Click
          </button>
        </>
      );
    }

    render(
      <StashProvider>
        <Counter1 />
        <Counter2 />
      </StashProvider>
    );

    expect(screen.getByTestId("count1")).toHaveTextContent("0");
    expect(screen.getByTestId("count2")).toHaveTextContent("0");
    expect(screen.getByTestId("renders1")).toHaveTextContent("0");
    expect(screen.getByTestId("renders2")).toHaveTextContent("0");

    await userEvent.click(screen.getByTestId("increment1"));
    expect(screen.getByTestId("count1")).toHaveTextContent("1");
    expect(screen.getByTestId("count2")).toHaveTextContent("0");
    expect(screen.getByTestId("renders1")).toHaveTextContent("1");
    expect(screen.getByTestId("renders2")).toHaveTextContent("0");

    await userEvent.click(screen.getByTestId("increment2"));
    expect(screen.getByTestId("count1")).toHaveTextContent("1");
    expect(screen.getByTestId("count2")).toHaveTextContent("1");
    expect(screen.getByTestId("renders1")).toHaveTextContent("1");
    expect(screen.getByTestId("renders2")).toHaveTextContent("1");
  });

  test("throws error if provider is missing", () => {
    const [useCounter] = createStrictStash(() => ({ count: 0 }), "Counter");

    function TestComponent() {
      useCounter();
      return null;
    }

    expect(() => render(<TestComponent />)).toThrowError(
      "Counter Context Provider is missing in the tree"
    );
  });

  test("provides the stash state and accepts selectors", () => {
    const [useCounter, CounterProvider] = createStrictStash(() => ({
      count: 0,
    }));

    function WithSelector() {
      const { count } = useCounter((state) => ({ count: state.count }));
      return <span data-testid="count-selector">{count}</span>;
    }

    function WithoutSelector() {
      const { count } = useCounter();
      return <span data-testid="count-full">{count}</span>;
    }

    render(
      <CounterProvider>
        <WithSelector />
        <WithoutSelector />
      </CounterProvider>
    );

    expect(screen.getByTestId("count-selector")).toHaveTextContent("0");
    expect(screen.getByTestId("count-full")).toHaveTextContent("0");
  });

  describe("set works with both direct objects and callbacks", () => {
    test("state updates correctly with direct object", async () => {
      type ActionStash = {
        action: "1" | "2";
        setAction: (newAction: "1" | "2") => void;
      };

      const [useStash, StashProvider] = createStrictStash<ActionStash>(
        (set) => ({
          action: "1",
          setAction: (action) => set({ action }),
        })
      );

      function ActionButton() {
        const setAction = useStash(({ setAction }) => setAction);
        return (
          <button data-testid="button" onClick={() => setAction("2")}>
            Change
          </button>
        );
      }

      function ActionDisplay() {
        const action = useStash(({ action }) => action);
        return <div data-testid="action">{action}</div>;
      }

      render(
        <StashProvider>
          <ActionButton />
          <ActionDisplay />
        </StashProvider>
      );

      expect(screen.getByTestId("action")).toHaveTextContent("1");
      await userEvent.click(screen.getByTestId("button"));
      expect(screen.getByTestId("action")).toHaveTextContent("2");
    });

    test("state updates correctly with callback", async () => {
      type ActionStash = {
        action: "1" | "2";
        setAction: (newAction: "1" | "2") => void;
      };

      const [useStash, StashProvider] = createStrictStash<ActionStash>(
        (set) => ({
          action: "1",
          setAction: (action) => set(() => ({ action })),
        })
      );

      function ActionButton() {
        const setAction = useStash(({ setAction }) => setAction);
        return (
          <button data-testid="button" onClick={() => setAction("2")}>
            Change
          </button>
        );
      }

      function ActionDisplay() {
        const action = useStash(({ action }) => action);
        return <div data-testid="action">{action}</div>;
      }

      render(
        <StashProvider>
          <ActionButton />
          <ActionDisplay />
        </StashProvider>
      );

      expect(screen.getByTestId("action")).toHaveTextContent("1");
      await userEvent.click(screen.getByTestId("button"));
      expect(screen.getByTestId("action")).toHaveTextContent("2");
    });
  });
});
